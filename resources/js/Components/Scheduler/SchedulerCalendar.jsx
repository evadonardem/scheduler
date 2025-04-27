import { Alert, Autocomplete, Backdrop, Badge, Box, Button, Card, CardActions, CardContent, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Drawer, FormControlLabel, Grid, IconButton, MenuItem, Paper, Radio, RadioGroup, Snackbar, Stack, styled, Table, TableBody, TableCell, TableContainer, TableFooter, TableHead, TableRow, TextField, Tooltip, tooltipClasses, Typography } from "@mui/material";
import moment from "moment";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import PropTypes from "prop-types";
import axios from "axios";
import { clone, find, includes } from "lodash";
import { Apartment, AvTimer, CalendarMonth, Event, Menu, Person, RoomPreferences, School, Subject } from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers";
import { Link, usePage } from "@inertiajs/react";

const minTime = new Date(0, 0, 0, 7, 0); // 7:00 AM
const maxTime = new Date(0, 0, 0, 21, 0); // 9:00 PM
moment.locale('ko', {
  week: {
    dow: 1,
    doy: 1,
  },
});
const localizer = momentLocalizer(moment);
const CalendarDragAndDrop = withDragAndDrop(Calendar);
const EllipsisText = styled(Typography)(() => ({
  maxWidth: "150px",
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));
const WeekdaysShortLookup = moment.weekdaysShort();
const HtmlTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#f5f5f9',
    fontSize: theme.typography.pxToRem(12),
    whiteSpace: 'nowrap',
    padding: 0,
  },
}));
const EventTooltip = React.memo(({ text, subjectClass, ellipsisText = true }) => {
  const {
    color,
    code: subjectClassCode,
    credit_hours: creditHours,
    subject: {
      code: subjectCode,
      title: subjectTitle,
    },
    section: {
      id: sectionId,
      course: {
        code: courseCode,
      },
      year_level: yearLevel,
      is_block: isBlock,
    },
    schedule,
    assigned_to: assignedTo
  } = subjectClass;
  const {
    first_name: assignedToFirstName,
    last_name: assignedToLastName,
  } = assignedTo ?? {};
  const {
    days
  } = schedule ?? {};
  return (
    <HtmlTooltip title={<React.Fragment> 
      <Card sx={{ bgcolor: `${color}88`, border: `5px solid ${color}`, color: "black" }}>
        <CardContent>
          <Box>
            <Typography variant="h6">{subjectClassCode}</Typography>
            <Typography variant="subtitle2">({subjectCode}) {subjectTitle}</Typography>
          </Box>
          <Divider sx={{ color: {color}, my: 2 }} />
          <Stack spacing={1}>
            <Chip icon={<School />} label={`${courseCode} ${yearLevel} (${isBlock ? "Blk." : ""} Sec. ${sectionId})`} />
            <Chip icon={<Person />} label={`${assignedTo ? `${assignedToLastName}, ${assignedToFirstName}` : "(Unassigned)"}`} />
            <Chip icon={<AvTimer />} label={`Credit Hrs.: ${Number(creditHours).toFixed(2)}`} />
          </Stack>
          <Divider sx={{ color: {color}, my: 2 }} />
          <Stack spacing={1}>
            { days && days.map(({ day, duration_in_hours: durationInHours }) => <Chip icon={<Event />} label={`${WeekdaysShortLookup[day]} (${Number(durationInHours).toFixed(2)})`} />)}
          </Stack>
        </CardContent>
      </Card>
    </React.Fragment>}>
      {ellipsisText ? <EllipsisText variant="body2">{text}</EllipsisText> : <Typography variant="body2">{text}</Typography>}
    </HtmlTooltip>
  );
});

const SchedulerCalendar = ({ academicYearScheduleId: defaultAcademicYearScheduleId }) => {
  const { auth: { token, department: authUserDepartment, roles: authUserRoles } } = usePage().props;
  const initialFilters = {};

  if (authUserDepartment) {
    initialFilters.department = authUserDepartment;
  }

  const toAcademicYearScheduleId = window.localStorage.getItem('academic-year-schedule-id');
  const initialAcacademicYearScheduleId = toAcademicYearScheduleId ? toAcademicYearScheduleId : defaultAcademicYearScheduleId;

  // flags to check scheduler is open
  const [isChecking, setIsChecking] = useState(true);
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);

  // calendar view
  const [calendarView, setCalendarView] = useState(Views.WEEK);

  // calendar positioning
  const calendarRef = useRef(null);
  const unscheduledSubjectClassesRef = useRef(null);

  const resourceRefs = useRef({});
  const eventRefs = useRef({});
  const calendarTimeContentScrollToRef = useRef({ left: 0, top: 0 });
  const unscheduledSubjectClassesScrollToRef = useRef({ left: 0, top: 0 });

  // API check states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load academic schedule flags
  const [academicYearStart, setAcademicYearStart] = useState(null);
  const [academicYearEnd, setAcademicYearEnd] = useState(null);
  const [semesterId, setSemesterId] = useState(null);
  const [academicYearScheduleId, setAcademicYearScheduleId] = useState(initialAcacademicYearScheduleId);
  const [isNotFoundAcademicYearSchedule, setIsNotFoundAcademicYearSchedule] = useState(null);

  const [academicYearSchedule, setAcademicYearSchedule] = useState(null);
  const [departments, setDepartments] = useState(null);
  const [rooms, setRooms] = useState(null);
  const [resources, setResources] = useState(null);
  const [unscheduledEvents, setUnscheduledEvents] = useState(null);
  const [events, setEvents] = useState(null);
  const draggedEvent = useRef(null);

  const [filters, setFilters] = useState(initialFilters);
  const [openSchedulerCalendarDrawer, setOpenSchedulerCalendarDrawer] = useState(false);

  /**
   * Scheduler Calendar Utility Functions
   */
  const hasConflicts = (newEvent, lookupEvents) => {
    const newEventRange = [moment(newEvent.start), moment(newEvent.end)];
    return lookupEvents.some(({ start, end }) =>
      newEventRange[0].isBetween(moment(start), moment(end), null, "[)") ||
      newEventRange[1].isBetween(moment(start), moment(end))
    );
  };

  const recallScrollPosition = useCallback(() => {
    const timeContentElement = calendarRef.current?.querySelector('.rbc-time-content');
    if (timeContentElement) {
      timeContentElement.scrollLeft = calendarTimeContentScrollToRef.current.left;
      timeContentElement.scrollTop = calendarTimeContentScrollToRef.current.top;
    }

    const unscheduleSubjectClassesElement = unscheduledSubjectClassesRef.current;
    if (unscheduleSubjectClassesElement) {
      unscheduleSubjectClassesElement.scrollLeft = unscheduledSubjectClassesScrollToRef.current.left;
      unscheduleSubjectClassesElement.scrollTop = unscheduledSubjectClassesScrollToRef.current.top;
    }
  }, []);

  const rememberScollPosition = useCallback((params = {
    calendarTimeContent: true,
    unscheduledSubjectClassesContent: true
  }) => {
    const el = calendarRef.current.querySelector('.rbc-time-content');
    if (el && params?.calendarTimeContent) {
      calendarTimeContentScrollToRef.current.left = el.scrollLeft;
      calendarTimeContentScrollToRef.current.top = el.scrollTop;
    } else {
      calendarTimeContentScrollToRef.current.left = 0;
      calendarTimeContentScrollToRef.current.top = 0;
    }
    const unscheduleSubjectClassesElement = unscheduledSubjectClassesRef.current;
    if (unscheduleSubjectClassesElement && params?.unscheduledSubjectClassesContent) {
      unscheduledSubjectClassesScrollToRef.current.left = unscheduleSubjectClassesElement.scrollLeft;
      unscheduledSubjectClassesScrollToRef.current.top = unscheduleSubjectClassesElement.scrollTop;
    } else {
      unscheduledSubjectClassesScrollToRef.current.left = 0;
      unscheduledSubjectClassesScrollToRef.current.top = 0;
    }
  }, []);

  const SchedulerCalendarOnEventDrop = useCallback(async ({ event, start, end }) => {
    const currEventDay = moment(event.start).day();
    const newEventDay = moment(start).day();
    const newEvent = clone(event);
    newEvent.start = start;
    newEvent.end = end;

    rememberScollPosition();

    const tempEvents = events.filter((e) => e.resourceId == event.resourceId && (
      e.id != event.id || e.id == event.id && moment(e.start) == newEventDay
    ));

    const isConflict = hasConflicts(newEvent, tempEvents);
    if (isConflict) {
      setError({
        message: "Time slot has conflicts.",
      });
      return;
    }

    if (currEventDay === newEventDay) {
      const relatedEvents = events.filter((e) => e.id === event.id);

      const updatedSchedule = {
        per_session_duration: moment(newEvent.end).diff(moment(newEvent.start), 'hours', true),
        days: [],
      };

      relatedEvents.forEach((relatedEvent) => {
        const relatedEventDay = moment(relatedEvent.start).day();
        updatedSchedule.days.push({
          day: relatedEventDay,
          duration_in_hours: moment(newEvent.end).diff(moment(newEvent.start), 'hours', true),
          start_time: {
            hour: moment(newEvent.start).hour(),
            minute: moment(newEvent.start).minute(),
            second: moment(newEvent.start).second()
          },
          resource_id: relatedEvent.resourceId,
        });
      });

      updateSubjectClassSchedule(event.id, updatedSchedule).then(() => {
        fetchAcademicYearSchedule(academicYearScheduleId, filters).then((result) => {
          const { data: academicYearSchedule, meta: { scheduledEvents, unscheduledSubjectClasses } } = result.data;
          scheduledEvents.forEach((event) => {
            event.start = new Date(event.start);
            event.end = new Date(event.end);
          });
          setAcademicYearSchedule(academicYearSchedule);
          setUnscheduledEvents(filters?.department ? unscheduledSubjectClasses : []);
          setEvents(scheduledEvents);
        });
      }).catch((error) => {
        const { error: errorMessage } = error.response.data;
        setError({
          message: errorMessage,
        });
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      setError({
        message: "Subject class event cannot be moved to another day.",
      });
    }
  }, [events]);

  const toggleSchedulerCalendarDrawer = (newOpenSchedulerCalendarDrawer) => () => {
    rememberScollPosition();
    setOpenSchedulerCalendarDrawer(newOpenSchedulerCalendarDrawer);
  };

  /**
   * selected event from the calendar
   */
  const [selectedEvent, setSelectedEvent] = useState(null);
  const handleShowEventDialog = useCallback((event) => {
    rememberScollPosition();
    setSelectedEvent(event);
  }, []);
  const handleCloseEventDialog = useCallback(() => {
    rememberScollPosition();
    setSelectedEvent(null);
  }, []);


  const handleDragStart = useCallback((event) => draggedEvent.current = event, []);

  /**
   * API calls
   */
  const checkSchedulerIsOpen = async () => {
    return await axios.get(
      `api/scheduler-is-open`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
  };

  const findScheduleByAcademicYearAndSemesterId = async (academicYear, semesterId) => {
    return await axios.get(
      `api/find-schedule/${academicYear}/${semesterId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
  };

  const fetchAcademicYearSchedule = async (academicYearScheduleId, filters) => {
    return await axios.get(
      `api/academic-year-schedules/${academicYearScheduleId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          filters,
        },
      }
    );
  };

  const updateSubjectClassSchedule = async (subjectClassId, schedule) => {
    return await axios.patch(
      `api/subject-classes/${subjectClassId}/schedule`,
      {
        schedule
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );
  };

  const fetchDepartments = async () => {
    return await axios.get(
      `api/common/departments`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          filters: filters,
        },
      }
    );
  };

  const fetchRooms = async (department) => {
    return await axios.get(
      `api/common/rooms`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          filters: department ? { department } : {},
        },
      }
    );
  };

  /**
   * on load check scheduler is open
   */
  useEffect(() => {
    (async () => {
      try {
        await checkSchedulerIsOpen();
        setIsSchedulerOpen(true);
      } catch (_error) {
        setIsSchedulerOpen(false);
      }
      setIsChecking(false);
    })();
  }, []);

  useEffect(() => {
    if (!academicYearScheduleId) {
      return;
    }

    const fetchData = async () => {
      try {
        const departmentsResult = await fetchDepartments();
        const roomsResult = await fetchRooms(filters?.department);
        const academicYearScheduleResult = await fetchAcademicYearSchedule(academicYearScheduleId, filters);

        const { data: departments } = departmentsResult.data;
        const { data: rooms } = roomsResult.data;
        const { data: academicYearSchedule, meta: { scheduledEvents, unscheduledSubjectClasses } } = academicYearScheduleResult.data;

        setRooms(rooms);
        setDepartments(departments);
        setAcademicYearSchedule(academicYearSchedule);

        scheduledEvents.forEach((event) => {
          event.start = new Date(event.start);
          event.end = new Date(event.end);
        });
        setEvents(scheduledEvents);

        setUnscheduledEvents(filters?.department ? unscheduledSubjectClasses : []);
        setIsLoading(false);
      } catch (_error) {
        window.location.reload();
      }
    };
    setIsLoading(true);
    fetchData();
  }, [academicYearScheduleId]);

  useEffect(() => {
    if (!academicYearScheduleId || Object.keys(filters).length === 0) {
      return;
    }

    const fetchData = async () => {
      try {
        const roomsResult = await fetchRooms(filters?.department);
        const academicYearScheduleResult = await fetchAcademicYearSchedule(academicYearScheduleId, filters);

        const { data: rooms } = roomsResult.data;
        const { data: academicYearSchedule, meta: { scheduledEvents, unscheduledSubjectClasses } } = academicYearScheduleResult.data;

        setRooms(rooms);
        setAcademicYearSchedule(academicYearSchedule);

        scheduledEvents.forEach((event) => {
          event.start = new Date(event.start);
          event.end = new Date(event.end);
        });
        setEvents(scheduledEvents);

        setUnscheduledEvents(filters?.department ? unscheduledSubjectClasses : []);
        setIsLoading(false);
      } catch (_error) {
        window.location.reload();
      }
    };
    setIsLoading(true);
    fetchData();
  }, [academicYearScheduleId, filters]);

  useEffect(() => {
    let filteredResources = rooms;
    if (filters?.room) {
      filteredResources = rooms.filter((room) => room.id == filters.room.id);
    }
    setResources(filteredResources);
  }, [rooms]);

  useEffect(() => {
    if (!academicYearSchedule) {
      return;
    }
    recallScrollPosition();
  }, [academicYearSchedule, error, events, openSchedulerCalendarDrawer, resources, selectedEvent, unscheduledEvents]);

  const SchedulerFilters = () => <Box sx={{ mb: 2 }}>
    <Autocomplete
      key={`department-${filters?.department?.id ?? 0}`}
      disablePortal
      fullWidth
      defaultValue={filters?.department ?? null}
      getOptionLabel={(option) => `${option.code} - ${option.title}`}
      options={departments}
      onChange={(_event, value) => {
        rememberScollPosition({ calendarTimeContent: false, unscheduledSubjectClassesContent: false });
        setFilters({
          ...filters,
          department: value,
          room: null,
        });
      }}
      readOnly={!includes('Super Admin', authUserRoles)}
      renderInput={(params) => <TextField {...params} label="Department" />}
      sx={{ mb: 2 }}
    />
    {calendarView === Views.WEEK && <Autocomplete
      key={`room-${filters?.department?.id ?? 0}`}
      disablePortal
      fullWidth
      defaultValue={filters?.room ?? null}
      getOptionLabel={(option) => `${option.code} - ${option.name}`}
      options={rooms}
      onChange={(_event, value) => {
        rememberScollPosition({ calendarTimeContent: false, unscheduledSubjectClassesContent: true });
        setFilters({
          ...filters,
          room: value,
        });
      }}
      renderInput={(params) => <TextField {...params} label="Room" />}
    />}
  </Box>;

  const SubjectClassesQueue = ({ unscheduledEvents }) => (
    <Paper sx={{ height: "70vh", padding: 2 }}>
      <Typography>
        Subject Classes <Badge badgeContent={`${unscheduledEvents?.length ?? 0}`} color="primary">
          <Subject color="action" />
        </Badge>
      </Typography>
      <Divider sx={{ my: 2 }} />
      <Box ref={unscheduledSubjectClassesRef} sx={{ height: "90%", overflowY: "auto" }}>
        {unscheduledEvents.map((event) => {
          const {
            schedule,
            code: subjectClassCode,
            subject: {
              code: subjectCode,
              title: subjectTitle,
            },
            credit_hours: creditHours,
            section: {
              id: sectionId,
              course: {
                code: courseCode,
              },
              year_level: yearLevel,
              is_block: isBlock,
            },
            assigned_to: assignedTo,
          } = event;
          return (
            <div
              draggable
              key={`unscheduled-event-${event.id}`}
              onDragStart={(e) => {
                const { schedule, assigned_to: assignedTo } = event;
                if (schedule && assignedTo) {
                  handleDragStart({ title: `${event.code} - ${event.subject.title}`, ...event });
                } else {
                  e.preventDefault();
                }
              }}
              onDragEnd={() => {
                // setDraggedEvent(null);
                }}
              >
              <Card sx={{ my: 1, border: 3, borderColor: `${event.color}`, bgcolor: `${event.color}88` }}>
                <CardContent sx={{ mb: 0, pb: 0 }}>
                  <EventTooltip text={`${subjectClassCode} - (${subjectCode}) ${subjectTitle}`} subjectClass={event} ellipsisText={false} />
                </CardContent>
                <CardActions>
                  <Alert severity={schedule && assignedTo ? "success" : "warning"} variant="filled" sx={{p: 1, pt: 0, pb: 0 }}>
                    {schedule && assignedTo ? "Schedule Ready" : "Not Ready"}
                  </Alert>
                </CardActions>
              </Card>
            </div>
          );
        })}
      </Box>
    </Paper>
  );

  /**
   * Scheduler Calendar Filters
   */
  const SchedulerCalendarMenu = (<Box width={"100%"}>
    <Button onClick={toggleSchedulerCalendarDrawer(!openSchedulerCalendarDrawer)} variant="contained">Close</Button>
    <Divider sx={{ my: 1 }} />
    <SchedulerFilters />
    {
      ['Super Admin', 'Dean', 'Associate Dean'].some(role => authUserRoles.includes(role)) &&
      calendarView === Views.WEEK &&
      filters?.department &&
      unscheduledEvents &&
      <SubjectClassesQueue unscheduledEvents={unscheduledEvents} />
    }
  </Box>);

  /**
   * Scheduler Calendar
   */
  const SchedulerCalendarOnDropFromOutside = async ({ start, end, resource: resourceId }) => {
    const startDate = moment(start).startOf('day');
    const endDate = moment(end).startOf('day');

    rememberScollPosition();

    if (moment(start).isSame(startDate) && moment(end).isSame(endDate)) {
      draggedEvent.current = null;
      return;
    }

    if (draggedEvent.current) {
      const { schedule } = draggedEvent.current ?? {};
      const { days: scheduledDays } = schedule ?? [];
      const updatedSchedule = {
        days: [],
      };
      scheduledDays.forEach((day) => {
        const { hour, minute, second } = {
          hour: moment(start).hour(),
          minute: moment(start).minute(),
          second: moment(start).second(),
        };

        updatedSchedule.days.push({
          day: day.day,
          duration_in_hours: day.duration_in_hours,
          start_time: {
            hour,
            minute,
            second
          },
          resource_id: resourceId,
        });
      });

      updateSubjectClassSchedule(draggedEvent.current?.id, updatedSchedule).then(() => {
        draggedEvent.current = null;
        fetchAcademicYearSchedule(academicYearScheduleId, filters).then((result) => {
          const { data: academicYearSchedule, meta: { scheduledEvents, unscheduledSubjectClasses } } = result.data;
          scheduledEvents.forEach((event) => {
            event.start = new Date(event.start);
            event.end = new Date(event.end);
          });
          setAcademicYearSchedule(academicYearSchedule);
          setUnscheduledEvents(filters?.department ? unscheduledSubjectClasses : []);
          setEvents(scheduledEvents);
        });
      }).catch((error) => {
        const { error: errorMessage } = error.response.data;
        setError({
          message: errorMessage,
        });
      }).finally(() => {
        setIsLoading(false);
      });
    }
  };
  const SchedulerCalendar = React.memo(({ academicYear, semester, startDate, endDate, plottableWeek, events, resources }) => {
    const memoizedEventComponent = useCallback(
      ({
        title,
        event: selectedEvent,
      }) => (
        <Box
          ref={(el) => (eventRefs.current[`${selectedEvent.id}-${selectedEvent.instanceId}`] = el)}
          alignItems="center"
        >
          <EventTooltip text={title} subjectClass={selectedEvent.subjectClass} />
        </Box>
      ),
      []
    );
    const memoizedResourceHeaderComponent = useCallback(
      ({ resource }) => {
        const { code, name, department: { code: departmentCode } } = resource;
        return <Box
          ref={(el) => (resourceRefs.current[resource.id] = el)}
          bgcolor={resource.color ? `${resource.color}88` : 'inherit'}
          border={5}
          borderColor={resource.color ?? 'inherit'}
          padding={1}
          tabIndex={0}
          sx={{
            '&:focus': {
              outline: '2px solid blue',
            },
          }}
        >
          <Chip label={`(${code}) ${name}`} icon={<RoomPreferences sx={{ fontSize: 22 }} />} color="default" sx={{ fontSize: 11 }} />
          <Chip label={departmentCode} icon={<Apartment sx={{ fontSize: 22 }} />} color="default" sx={{ fontSize: 11 }} />
        </Box>;
      },
      []
    );
    const memoizedEventPropGetter = useCallback(
      (event) => {
        if (calendarView === Views.AGENDA) {
          return {};
        }
        return {
          style: {
            border: `3px solid ${event.color ?? "inherit"}`,
            backgroundColor: event.color ? `${event.color}88` : "inherit",
            color: "black",
          },
          tabIndex: 0,
        };
      },
      []
    );
    const memoizedResourcePropGetter = useCallback(
      () => ({
        tabIndex: 0,
      }),
      []
    );
    const components = useMemo(() => ({
      resourceHeader: memoizedResourceHeaderComponent,
      toolbar: () => null,
      week: {
        event: memoizedEventComponent,
      },
    }), []);
    const handleChangeCalendarView = useCallback((e) => {
      setCalendarView(e.target.value);
    }, []);
    return (<Box width={openSchedulerCalendarDrawer ? "78%" : "100%"}>
      <Box>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Box>
              <Typography variant="h6">{semester.title} A.Y. {academicYear}</Typography>
              <Typography variant="subtitle2">{moment(startDate).format("DD MMM YYYY")} - {moment(endDate).format("DD MMM YYYY")}</Typography>
            </Box>
          </Grid>
          <Grid item>
            <Box display="flex" alignItems="center" justifyContent="flex-end">
              <RadioGroup row value={calendarView} onChange={handleChangeCalendarView}>
                <FormControlLabel value={Views.WEEK} control={<Radio />} label="Resource View" />
                <FormControlLabel value={Views.AGENDA} control={<Radio />} label="Summary View" />
              </RadioGroup>
              <IconButton onClick={toggleSchedulerCalendarDrawer(!openSchedulerCalendarDrawer)}>
                <Menu />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <Box
      ref={calendarRef}
      onDragOver={(e) => e.preventDefault()}
      sx={{ height: "70vh", overflow: "auto" }}
      >
      <CalendarDragAndDrop
        components={components}
        defaultDate={plottableWeek.start}
        defaultView={calendarView}
        draggableAccessor={() => filters?.department ? "id" : false}
        dragFromOutsideItem={() => false}
        eventPropGetter={memoizedEventPropGetter}
        events={events}
        formats={{
        dayFormat: "ddd",
        }}
        localizer={localizer}
        max={maxTime}
        min={minTime}
        onDoubleClickEvent={useCallback(
        (event) => handleShowEventDialog(event),
        [academicYearSchedule.subject_classes]
        )}
        onDropFromOutside={SchedulerCalendarOnDropFromOutside}
        onDragOverFromOutside={useCallback(() => {
        console.log('check being drag over from outside...');
        }, [])}
        onEventDrop={['Super Admin', 'Dean', 'Associate Dean'].some(role => authUserRoles.includes(role)) ? SchedulerCalendarOnEventDrop : false}
        resources={resources}
        resourcePropGetter={memoizedResourcePropGetter}
        startAccessor={"start"}
        step={15}
        tooltipAccessor={() => false}
        endAccessor={"end"}
      />
      </Box>
    </Box>);
  });

  /**
   * Show Event Details Dialog
   */
  const ShowEventDetails = React.memo(({ selectedEvent, handleCloseEventDialog }) => {
    if (!selectedEvent) {
      return null;
    }

    const { subjectClass: {
      schedule,
      subject,
      id: subjectClassId,
      code: subjectClassCode,
      color: subjectClassColor,
      assigned_to: assignedTo,
    } } = selectedEvent;

    const {
      first_name: firstName,
      last_name: lastName,
    } = assignedTo || {};
    const assignedToFullName = `${lastName}, ${firstName}`;

    const handleUnscheduleSubjectClass = useCallback(async () => {
      const updatedSchedule = schedule;
      updatedSchedule.days.forEach((day) => {
        day.start_time = null;
        day.resource_id = null;
      });
      rememberScollPosition();
      setSelectedEvent(null);
      updateSubjectClassSchedule(subjectClassId, updatedSchedule).then(() => {
        fetchAcademicYearSchedule(academicYearScheduleId, filters).then((result) => {
          const { data: academicYearSchedule, meta: { scheduledEvents, unscheduledSubjectClasses } } = result.data;
          scheduledEvents.forEach((event) => {
            event.start = new Date(event.start);
            event.end = new Date(event.end);
          });
          setAcademicYearSchedule(academicYearSchedule);
          setUnscheduledEvents(filters?.department ? unscheduledSubjectClasses : []);
          setEvents(scheduledEvents);
        });
      }).finally(() => {
        setIsLoading(false);
      });
    });

    return <Dialog
      fullWidth
      open
      onClose={handleCloseEventDialog}
    >
      <DialogTitle
        bgcolor={selectedEvent.color ? `${subjectClassColor}80` : "inherit"}
        borderBottom={5}
        borderColor={subjectClassColor ?? "inherit"}
      >
        <Typography variant="h6">{subjectClassCode}</Typography>
      </DialogTitle>
      <DialogContent sx={{ my: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Subject sx={{ fontSize: 22 }} />
          <Typography>{`(${subject.code}) ${subject.title}`}</Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Person sx={{ fontSize: 22 }} />
          <Typography>{assignedToFullName}</Typography>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Event sx={{ fontSize: 22 }} />
          <Typography>Schedule</Typography>
        </Box>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Day</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>End Time</TableCell>
                <TableCell>Dur. in Hrs.</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedule && schedule.days.map((day, index) => {
                const {
                  start_time: { hour, minute, second },
                } = day;
                const ddd = moment().day(day.day).format('ddd');
                const dateRef = moment(new Date(0, 0, 0, hour, minute, second));
                const scheduleStart = dateRef.format("hh:mm A");
                const scheduleEnd = dateRef.clone().add(day.duration_in_hours, 'hours').format("hh:mm A");
                const room = find(resources, { id: day.resource_id });
                return <TableRow key={`${day.day}-${index}`}>
                  <TableCell>{ddd}</TableCell>
                  <TableCell>{scheduleStart}</TableCell>
                  <TableCell>{scheduleEnd}</TableCell>
                  <TableCell>{room.name}</TableCell>
                  <TableCell>{Number(day.duration_in_hours).toFixed(2)}</TableCell>
                </TableRow>;
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} align="right">
                  Total Hrs.
                </TableCell>
                <TableCell>
                  {schedule && schedule.days.reduce((acc, day) => acc + Number(day.duration_in_hours), 0).toFixed(2)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        {
          ['Super Admin', 'Dean', 'Associate Dean'].some(role => authUserRoles.includes(role)) &&
          filters?.department &&
          <Button onClick={handleUnscheduleSubjectClass} color="secondary" variant="contained">Unschedule</Button>
        }
        <Button onClick={handleCloseEventDialog} color="primary" variant="contained">Close</Button>
      </DialogActions>
    </Dialog>;
  }, [selectedEvent, handleCloseEventDialog]);

  /**
   * Snackbar Error
   */
  const SnackbarError = React.memo(({ error }) => {
    const handleClose = useCallback(() => {
      setError(null);
    }, []);
    return <Snackbar
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      open={!!error}
      autoHideDuration={3000}
      onClose={handleClose}
    >
      <Alert
        onClose={handleClose}
        severity="error"
        sx={{ width: "100%" }}
        variant="filled"
      >
        {error?.message}
      </Alert>
    </Snackbar>;
  });

  /**
   * Schedule Dialog
   */
  const FindSchedule = () => <Dialog
    open
    slotProps={{
      paper: {
        component: 'form',
        onSubmit: (event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const formJson = Object.fromEntries(formData.entries());
          findScheduleByAcademicYearAndSemesterId(`${formJson.academic_year_start}-${formJson.academic_year_end}`, formJson.semester_id)
            .then((result) => {
              const { data: { id: academicYearScheduleId } } = result.data;
              setIsNotFoundAcademicYearSchedule(null);
              setAcademicYearScheduleId(academicYearScheduleId);
            })
            .catch(() => {
              setIsNotFoundAcademicYearSchedule("Schedule not available for this academic year and semester.");
            })
            .finally(() => {
              setIsLoading(false);
            });
        },
      },
    }}
  >
    <DialogTitle>Schedule</DialogTitle>
    <DialogContent>
      <DialogContentText>Find for available academic year schedule.</DialogContentText>
      <Box sx={{ display: "flex", alignItems: "center", my: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <DatePicker
            views={['year']}
            label="A.Y. Start"
            defaultValue={academicYearStart}
            name="academic_year_start"
            onChange={(value) => {
              setIsNotFoundAcademicYearSchedule(null);
              if (value) {
                setAcademicYearStart(value);
                setAcademicYearEnd(value.add(1, 'year'));
              } else {
                setAcademicYearStart(null);
                setAcademicYearEnd(null);
              }
            }}
            renderInput={(params) => <TextField {...params} sx={{}} />}
            sx={{ mr: 1 }}
          />
          <DatePicker
            readOnly
            label="A.Y. End"
            defaultValue={academicYearEnd}
            name="academic_year_end"
            renderInput={(params) => <TextField {...params} sx={{}} />}
            views={['year']}
          />
        </Box>
      </Box>

      <TextField
        fullWidth
        required
        select
        defaultValue={semesterId ?? "1"}
        label="Semester"
        name="semester_id"
        onChange={(e) => {
          e.preventDefault();
          setIsNotFoundAcademicYearSchedule(null);
          setSemesterId(e.target.value);
        }}
        sx={{ mb: 2 }}
      >
        <MenuItem value="1">1st Semester</MenuItem>
        <MenuItem value="2">2nd Semester</MenuItem>
      </TextField>

      {isNotFoundAcademicYearSchedule &&
        <Alert variant="filled" severity="warning">{isNotFoundAcademicYearSchedule}</Alert>}

    </DialogContent>
    <DialogActions>
      <Button type="submit" variant="contained">Load</Button>
    </DialogActions>
  </Dialog>;

  if (isChecking) {
    return <Backdrop
      open
      sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
  }

  if (!isChecking && !isSchedulerOpen) {
    return <Box
      alignContent="center"
      alignItems="center"
      textAlign="center"
      sx={{ height: "80vh", m: "auto", width: "30%" }}
    >
      <CalendarMonth sx={{ fontSize: 100, m: "auto" }} color="default" />
      <Alert variant="filled" sx={{ m: "auto" }} severity="info">No academic year schedules open for scheduling as of the moment.</Alert>
      <Divider sx={{ my: 2 }} />
      <Link href="/academic-year-schedules">
        <Button variant="contained" color="primary">
          Create Academic Year Schedule
        </Button>
      </Link>
    </Box>
  }

  return (<>
    <Backdrop
      sx={(theme) => ({ color: '#fff', zIndex: theme.zIndex.drawer + 1 })}
      open={isLoading}
    >
      <CircularProgress color="inherit" />
    </Backdrop>
    <SnackbarError error={error} />

    {!academicYearScheduleId && <FindSchedule />}

    {academicYearSchedule && events && resources && <>
      <SchedulerCalendar
        academicYear={academicYearSchedule.academic_year}
        semester={academicYearSchedule.semester}
        startDate={academicYearSchedule.start_date}
        endDate={academicYearSchedule.end_date}
        plottableWeek={academicYearSchedule.plottable_week}
        events={events}
        resources={resources}
      />
      <ShowEventDetails
        selectedEvent={selectedEvent}
        handleCloseEventDialog={handleCloseEventDialog}
        resources={resources} />
    </>}

    {academicYearSchedule && <Drawer anchor="right" open={openSchedulerCalendarDrawer} slotProps={{ paper: { sx: { p: 2, width: "20%" } } }} variant="persistent">
      {SchedulerCalendarMenu}
    </Drawer>}

  </>);
};

SchedulerCalendar.propTypes = {
  academicYearScheduleId: PropTypes.number,
};

SchedulerCalendar.defaultProps = {
  academicYearScheduleId: null,
};

export default SchedulerCalendar;