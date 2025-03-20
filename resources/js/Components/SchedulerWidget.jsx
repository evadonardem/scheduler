import { Badge, Box, Card, CardContent, Chip, Divider, Grid2, Paper, Typography } from "@mui/material";
import moment from "moment";
import { useCallback, useMemo, useState } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import PropTypes from "prop-types";
import ColorHash from "color-hash";
import axios from "axios";
import { usePage } from "@inertiajs/react";

const localizer = momentLocalizer(moment);
const CalendarDragAndDrop = withDragAndDrop(Calendar);
const colorHashGenerator = (str) => new ColorHash().hex(str);

const SchedulerWidget = ({
  academicYear,
  semester,
  startDate,
  endDate,
  subjectClasses,
  resources
}) => {

  const { auth } = usePage().props;
  const { token } = auth;

  const slots = (day) => {
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

  const unscheduledSubjectClasses = useMemo(() => {
    return subjectClasses.filter((subjectClass) => {
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
  }, [subjectClasses]);

  const scheduledSubjectClasses = useMemo(() => {
    return subjectClasses.filter((subjectClass) => {
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
  }, [subjectClasses]);

  const scheduledEvents = [];
  scheduledSubjectClasses.forEach((subjectClass) => {
    const { schedule } = subjectClass ?? {};
    const { per_session_duration, days } = schedule ?? {};

    days.forEach((day) => {
      const slotsByDay = slots(day.day);
      const { hour, minute, second, resource_id: resourceId } = {
        hour: day.start_time.hour,
        minute: day.start_time.minute,
        second: day.start_time.second,
        resource_id: day.resource_id,
      };

      slotsByDay.forEach((slot) => {
        const s = slot.clone().set({ hour, minute, second });
        const e = s.clone().add(per_session_duration, 'hours');
        scheduledEvents.push({
          id: subjectClass.id,
          title: subjectClass.code,
          color: colorHashGenerator(subjectClass.code),
          start: s.toDate(),
          end: e.toDate(),
          resourceId,
        });
      });
    });
  });

  const { defaultDate } = useMemo(() => ({
    defaultDate: startDate
  }), []);

  const [unscheduledEvents, setUnscheduledEvents] = useState(unscheduledSubjectClasses);
  const [events, setEvents] = useState(scheduledEvents);
  const [draggedEvent, setDraggedEvent] = useState();

  const handleDragStart = useCallback((event) => setDraggedEvent(event), []);

  const minTime = new Date(0, 0, 0, 6, 0); // 6:00 AM
  const maxTime = new Date(0, 0, 0, 23, 0); // 11:00 PM

  return (<>
    <Box textAlign={"center"}>
      <Typography variant="h6">A.Y. {academicYear} - {semester}</Typography>
      <Typography variant="subtitle1">{startDate.format('DD-MMM-YYYY')} - {endDate.format('DD-MMM-YYYY')}</Typography>
    </Box>
    <Grid2 container spacing={2}>
      <Grid2 size={3}>
        <Paper sx={{ height: "70vh", padding: 2 }}>
          <Typography variant="h6">Subject Classes</Typography>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ height: "80%", overflowY: "auto" }}>
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
                  setDraggedEvent(null);
                }}
              >
                <Card sx={{ my: 2, bgcolor: `${colorHashGenerator(`${event.code}`)}`}}>
                  <CardContent>
                    <Typography>{event.code} - ({event.subject.code}) {event.subject.title}</Typography>
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
        </Paper>
      </Grid2>
      <Grid2 size={9}>
        <Box sx={{ height: "75vh" }}>
          <CalendarDragAndDrop
            selectable
            components={{
              event: ({ title, event }) => {
                return <Box
                  alignItems="center"
                  bgcolor={`${event.color ?? "inherit"}`}
                  display="flex"
                  onClick={() => console.log(event)}
                  padding={1}
                >
                  <Typography variant="caption">{title}</Typography>
                </Box>;
              },
              resourceHeader: ({ resource }) => {
                const { code, name } = resource;
                return <Box padding={2}>
                  <Typography>{code}</Typography>
                  <Typography variant="caption">{name}</Typography>

                </Box>;
              },
            }}
            dayPropGetter={(date) => {
              if (draggedEvent) {
                const { schedule } = draggedEvent ?? {};
                const { days } = schedule ?? [];
                const scheduledDays = days.map((day) => day.day);
                if (!scheduledDays.includes(date.getDay())) {
                  return {
                    style: { display: 'none' },
                  };
                }
                return {};
              }
            }}
            defaultDate={defaultDate}
            defaultView={Views.WEEK}
            draggableAccessor="id"
            dragFromOutsideItem={() => false}
            events={events}
            localizer={localizer}
            max={maxTime}
            min={minTime}
            maxDate={endDate}
            minDate={startDate}
            onDropFromOutside={async ({ start, end, resource: resourceId }) => {
              
              const startDate = moment(start).startOf('day').toDate();
              const endDate = moment(end).startOf('day').toDate();

              if (moment(start).isSame(startDate) && moment(end).isSame(endDate)) {
                setDraggedEvent(null);
                return;
              }

              if (draggedEvent) {
                const { schedule } = draggedEvent ?? {};
                const { per_session_duration, days } = schedule ?? [];
                const scheduledDays = days.map((day) => day.day);

                const updatedSchedule = {
                  per_session_duration,
                  days: [],
                };
                const newEvents = [];
                scheduledDays.forEach((day) => {
                  const slotsByDay = slots(day);
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
                      id: draggedEvent.id,
                      title: draggedEvent.code,
                      color: colorHashGenerator(draggedEvent.code),
                      start: s.toDate(),
                      end: e.toDate(),
                      resourceId,
                    });
                  });
                });

                const x = await axios.patch(
                  `api/subject-classes/${draggedEvent.id}/schedule`,
                  {
                    schedule: updatedSchedule,
                  },
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                    },
                  }
                );

                if (x.status === 200) {
                  setEvents([...events, ...newEvents]);
                  setUnscheduledEvents(unscheduledEvents.filter((event) => event.id !== draggedEvent.id));
                }

                setDraggedEvent(null);

              }
            }}
            onDragOverFromOutside={(dragEvent) => {
              // console.log('onDragOverFromOutside', dragEvent);
            }}
            onEventDrop={(event) => {
              // console.log('onEventDrop', event);
            }}
            resources={resources}
            startAccessor={"start"}
            endAccessor={"end"}
          />
        </Box>
      </Grid2>
    </Grid2>
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