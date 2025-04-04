import { Autocomplete, Box, Card, CardContent, Chip, Dialog, DialogTitle, Divider, Grid, Paper, TextField, Typography } from "@mui/material";
import moment from "moment";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import PropTypes from "prop-types";
import ColorHash from "color-hash";
import axios from "axios";
import { find } from "lodash";
import { PunchClock, RoomPreferences } from "@mui/icons-material";

const minTime = new Date(0, 0, 0, 6, 0); // 6:00 AM
const maxTime = new Date(0, 0, 0, 22, 0); // 10:00 PM
moment.locale('ko', {
  week: {
    dow: 1,
    doy: 1,
  },
});
const localizer = momentLocalizer(moment);
const CalendarDragAndDrop = withDragAndDrop(Calendar);
const colorHashGenerator = (str) => new ColorHash().hex(str);

const SchedulerWidget = ({ token }) => {
  const slots = (day, startDate, endDate) => {
    let days = [];
    const start = startDate.clone();
    const end = endDate.clone();

    // Iterate from the start date to the end date
    while (start.isBefore(end) || start.isSame(end)) {
      // Check if the current day is Friday (5)
      if (start.isoWeekday() === day) {
        days.push(start.clone()); // Store the formatted date
      }
      // Move to the next day
      start.add(1, 'days');
    }

    return days; // Return the array of Fridays
  };

  // calendar positioning
  const calendarRef = useRef(null);
  const resourceRefs = useRef({});
  const eventRefs = useRef({});
  const [scrollToTime, setScrollToTime] = useState(minTime);

  const [academicYearSchedule, setAcademicYearSchedule] = useState(null);
  const [departments, setDepartments] = useState(null);
  const [rooms, setRooms] = useState(null);
  const [resources, setResources] = useState(null);
  const [unscheduledEvents, setUnscheduledEvents] = useState(null);
  const [events, setEvents] = useState(null);
  const draggedEvent = useRef(null);

  const filters = useRef({});
  const focusedSubjectClassId = useRef(null);

  /**
   * selected event from the calendar
   */
  const [selectedSubjectClass, setSelectedSubjectClass] = useState(null);
  const handleShowEventDialog = useCallback((event, subjectClasses) => {
    const subjectClass = find(subjectClasses, { id: event.id });
    setScrollToTime(event.start);
    setSelectedSubjectClass(subjectClass);

    const eventRef = eventRefs.current ? eventRefs.current[event.id] : null;
    if (eventRef) {
      eventRef.focus(); // Set focus on the event
      const eventRect = eventRef.getBoundingClientRect(); // Get event position
      const calendarRect = calendarRef.current.getBoundingClientRect(); // Get calendar position

      console.log('eventRect', eventRect);
      console.log('calendarRect', calendarRect);

      // Scroll to the specific event if it is out of view
      if (eventRect.left > calendarRect.left || eventRect.right > calendarRect.right) {
        const scrollPosition = eventRect.left;
        alert(scrollPosition);
        calendarRef.current.scrollLeft = scrollPosition; // Scroll to the specific event
      }
    }


  }, []);
  const handleCloseEventDialog = useCallback((e) => {
    e.stopPropagation();
    setSelectedSubjectClass(null);
  }, []);
  const showEventDetails = useMemo(() => <Dialog
    fullWidth
    open={!!selectedSubjectClass}
    onClose={handleCloseEventDialog}
    ref={selectedSubjectClass}
  >
    <DialogTitle>
      <Typography variant="h6">{selectedSubjectClass?.code}</Typography>
      <Typography variant="subtitle1">({selectedSubjectClass?.subject.code}) {selectedSubjectClass?.subject.title}</Typography>
      <Divider sx={{ my: 2 }} />
    </DialogTitle>
  </Dialog>, [selectedSubjectClass, handleCloseEventDialog]);


  const handleDragStart = useCallback((event) => draggedEvent.current = event, []);

  /**
   * API call to get the academic year schedule
   */
  const fetchAcademicSchedule = async () => {
    const result = await axios.get(
      `api/scheduler`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          filters: filters.current,
        },
      }
    );
  
    if (result.status === 200) {
      const { data: academicYearSchedule, meta: { departments, rooms, scheduledEvents } } = result.data;

      scheduledEvents.forEach((event) => {
        event.start = new Date(event.start);
        event.end = new Date(event.end);
      });

      setAcademicYearSchedule(academicYearSchedule);
      setRooms(rooms);
      setResources(rooms);
      setDepartments(departments);
      setEvents(scheduledEvents);
    }
  };

  useEffect(() => {
    fetchAcademicSchedule();
  }, []);

  useEffect(() => {
    if (!academicYearSchedule) {
      return;
    }

    const {
      plottable_week: plottableWeek,
      subject_classes: subjectClasses,
    } = academicYearSchedule;

    const startDate = moment(plottableWeek.start);
    const endDate = moment(plottableWeek.end);

    const unscheduledSubjectClasses = subjectClasses.filter((subjectClass) => {
      const { schedule } = subjectClass;
      let isScheduled = true;
      if (schedule) {
        const { days } = schedule;
        days.forEach((day) => {
          isScheduled = isScheduled && !!day.start_time && !!day.resource_id;
        });
      }
      return !schedule || !isScheduled;
    });

    const scheduledSubjectClasses = subjectClasses.filter((subjectClass) => {
      const { schedule } = subjectClass;
      let isScheduled = true;
      if (schedule) {
        const { days } = schedule;
        days.forEach((day) => {
          isScheduled = isScheduled && !!day.start_time && !!day.resource_id;
        });
      }
      return schedule && isScheduled;
    });

    setUnscheduledEvents(unscheduledSubjectClasses);
  }, [academicYearSchedule, calendarRef]);

  useEffect(() => {
    if (calendarRef.current && selectedSubjectClass) {
      eventRefs.current[selectedSubjectClass.id]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [calendarRef, selectedSubjectClass]);

  useEffect(() => {
    if (events && scrollToTime && focusedSubjectClassId.current) {
      console.log('focusedSubjectClassId', focusedSubjectClassId.current);
      console.log('focusedSubjectClassId', eventRefs.current[focusedSubjectClassId.current]);
      eventRefs.current[focusedSubjectClassId.current]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [events, focusedSubjectClassId, eventRefs, scrollToTime]);

  if (!academicYearSchedule || unscheduledEvents === null || events === null) {
    return <p>Loading...</p>;
  }

  const SchedulerFilters = () => <Paper sx={{ mb: 2, p: 2 }}>
    <Typography variant="h6">Filters</Typography>
    <Divider sx={{ my: 2 }} />
    <Autocomplete
      disablePortal
      defaultValue={filters.current?.department ?? null}
      getOptionLabel={(option) => `${option.code} - ${option.title}`}
      options={departments}
      onChange={(_event, value) => {
        console.log('filtered department', value);
        filters.current = {
          ...filters.current,
          department: value,
          room: null,
        };
        fetchAcademicSchedule();
      }}
      renderInput={(params) => <TextField {...params} label="Department" />}
    />
    <Autocomplete
      disablePortal
      defaultValue={filters.current?.room ?? null}
      getOptionLabel={(option) => `${option.code} - ${option.name}`}
      options={rooms}
      onChange={(_event, value) => {
        filters.current = {
          ...filters.current,
          room: value,
        };

        console.log(value);

        const filteredResources = rooms.filter((resource) => !value || resource.id == value.id);
        console.log('filteredReources', filteredResources);
        setResources(filteredResources);
      }}
      renderInput={(params) => <TextField {...params} label="Room" />}
    />
  </Paper>;

  const SubjectClassesQueue = ({ unscheduledEvents }) => <Paper sx={{ height: "70vh", padding: 2 }}>
    <Typography variant="h6">Subject Classes</Typography>
    <Divider sx={{ my: 2 }} />
    <Box sx={{ height: "80%", overflowY: "auto" }} onScroll={(e) => console.log('scroll subjects', e)}>
      {unscheduledEvents.map((event) => (
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
          <Card sx={{ my: 2, bgcolor: `${colorHashGenerator(`${event.code}`)}` }}>
            <CardContent>
              <Typography>{event.code} - ({event.subject.code}) {event.subject.title}</Typography>
              <Divider sx={{ my: 1 }} />
              <Chip
                label={`Duration (Hr.): ${event.schedule?.per_session_duration.toFixed(2) ?? 0}`}
                icon={<PunchClock />}
                color="secondary"
                sx={{ width: "100%" }} />
              {event.schedule?.days.map((day) => <Chip
                key={`${event.id}-${day.day}`}
                label={moment.weekdaysShort()[day.day]}
                color="secondary"
                sx={{ mr: 1 }}
              />)}
              <Divider sx={{ my: 1 }} />
              {event.assigned_to && <Chip label={event.assigned_to.first_name} color="secondary" />}
            </CardContent>
          </Card>
        </div>
      ))}
    </Box>
  </Paper>;

  /**
   * Scheduler Calendar
   */
  const SchedulerCalendarOnDropFromOutside = async ({ start, end, resource: resourceId }) => {
    const startDate = moment(start).startOf('day');
    const endDate = moment(end).startOf('day');

    if (moment(start).isSame(startDate) && moment(end).isSame(endDate)) {
      draggedEvent.current = null;
      return;
    }

    if (draggedEvent.current) {
      const { schedule } = draggedEvent.current ?? {};
      const { per_session_duration, days } = schedule ?? [];
      const scheduledDays = days.map((day) => day.day);

      const updatedSchedule = {
        per_session_duration,
        days: [],
      };
      const newEvents = [];
      scheduledDays.forEach((day) => {
        const slotsByDay = slots(day, startDate, endDate);
        const { hour, minute, second } = {
          hour: moment(start).hour(),
          minute: moment(start).minute(),
          second: moment(start).second(),
        };

        updatedSchedule.days.push({
          day,
          start_time: {
            hour,
            minute,
            second
          },
          resource_id: resourceId,
        });


        slotsByDay.forEach((slot) => {
          const s = slot.clone().set({ hour, minute, second });
          const e = s.clone().add(per_session_duration, 'hours');
          newEvents.push({
            id: draggedEvent.current?.id,
            title: draggedEvent.current?.code,
            color: colorHashGenerator(draggedEvent.current?.code),
            start: s.toDate(),
            end: e.toDate(),
            resourceId,
          });
        });
      });

      let updateSchedule = null;
      try {
        updateSchedule = await axios.patch(
          `api/subject-classes/${draggedEvent.current?.id}/schedule`,
          {
            schedule: updatedSchedule,
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
      } catch (error) {
        console.log(error);
        alert('Something went wrong. Please try again.');
      }
      
      if (updateSchedule) {
        setScrollToTime(new Date(0, 0, 0, updatedSchedule.days[0].start_time.hour, updatedSchedule.days[0].start_time.minute, 0));
        focusedSubjectClassId.current = draggedEvent.current?.id;
        fetchAcademicSchedule();
      } else {
        alert('Something went wrong. Please try again.');
      }
      draggedEvent.current = null;
    }
  };
  const SchedulerCalendar = ({ startDate, endDate, events, resources }) => <Box
    ref={calendarRef}
    onDragOver={(e) => e.preventDefault()}
    sx={{ height: "75vh" }}
  >
    <CalendarDragAndDrop
      selectable
      components={{
        event: ({ title, event }) => {
          return <Box
            ref={(el) => (eventRefs.current[event.id] = el)}
            alignItems="center"
            display="flex"
            padding={1}
          >
            <Typography variant="caption">{title}</Typography>
          </Box>;
        },
        resourceHeader: ({ resource }) => {
          const { code, name, department: { code: departmentCode } } = resource;
          return <Box
            ref={(el) => (resourceRefs.current[resource.id] = el)}
            bgcolor={resource.color ? `${resource.color}80` : 'inherit'}
            border={5}
            borderColor={resource.color ?? 'inherit'}
            padding={2}
          >
            <Chip label={`(${code}) ${name}`} icon={<RoomPreferences sx={{ fontSize: 22 }} />} color="default" sx={{ fontSize: 11 }} />
            <Divider sx={{ my: 1 }}/>
            <Typography variant="caption">{departmentCode}</Typography>
          </Box>;
        },
        toolbar: () => null,
      }}
      dayPropGetter={(date) => {
        if (draggedEvent.current) {
          const { schedule } = draggedEvent.current ?? {};
          const { days } = schedule ?? [];
          const scheduledDays = days.map((day) => day.day);
          // if (!scheduledDays.includes(date.getDay())) {
          //   return {
          //     style: { display: 'none' },
          //   };
          // }
          return {};
        }
      }}
      defaultDate={startDate}
      default
      defaultView={Views.WEEK}
      draggableAccessor="id"
      dragFromOutsideItem={() => false}
      eventPropGetter={(event) => ({
        style: {
          backgroundColor: event.color ?? "inherit",
        },
        tabIndex: 0,
      })}
      events={events}
      formats={{
        dayFormat: "ddd",
      }}
      localizer={localizer}
      max={maxTime}
      min={minTime}
      onDoubleClickEvent={(event) => handleShowEventDialog(event, academicYearSchedule.subject_classes)}
      onDropFromOutside={SchedulerCalendarOnDropFromOutside}
      onDragOverFromOutside={(dragEvent) => {
        console.log('davedave');
        // console.log('onDragOverFromOutside', dragEvent);
      }}
      onEventDrop={(event) => {
        // console.log('onEventDrop', event);
      }}
      resources={resources}
      resourcePropGetter={() => ({
        tabIndex: 0,
      })}
      scrollToTime={scrollToTime}
      startAccessor={"start"}
      step={15}
      endAccessor={"end"}
    />
  </Box>;

  return (<>
    <Box textAlign={"center"}>
      <Typography variant="h6">A.Y. {academicYearSchedule.academic_year} - {academicYearSchedule.semester.title}</Typography>
      <Typography variant="subtitle1">{academicYearSchedule.start_date} - {academicYearSchedule.end_date}</Typography>
    </Box>
    <Grid container spacing={2}>
      <Grid size={3}>
        <SchedulerFilters />
        <SubjectClassesQueue unscheduledEvents={unscheduledEvents} />
      </Grid>
      <Grid size={9}>
        <SchedulerCalendar
          startDate={academicYearSchedule.plottable_week.start}
          endDate={academicYearSchedule.plottable_week.end}
          events={events}
          onScroll={(x) => console.log(x)}
          resources={resources}
        />
      </Grid>

      {showEventDetails}

    </Grid>
  </>);
};

SchedulerWidget.propTypes = {
  academicYear: PropTypes.string.isRequired,
  semester: PropTypes.string.isRequired,
  startDate: PropTypes.isRequired,
  endDate: PropTypes.isRequired,
  resources: PropTypes.array.isRequired,
};

export default SchedulerWidget;