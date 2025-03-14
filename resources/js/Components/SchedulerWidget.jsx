import { Box, Paper, Tooltip, Typography } from "@mui/material";
import moment from "moment";
import { useMemo, useState } from "react";
import { Calendar, momentLocalizer, Views } from "react-big-calendar";
import 'react-big-calendar/lib/css/react-big-calendar.css';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import PropTypes from "prop-types";
import { CheckBox, Info } from "@mui/icons-material";

const localizer = momentLocalizer(moment);
const CalendarDragAndDrop = withDragAndDrop(Calendar);

const SchedulerWidget = ({ startDate, endDate, resources }) => {

  const { defaultDate } = useMemo(() => ({
    defaultDate: startDate
  }), []);

  const subjectClasses = [
    {
      id: 1,
      code: 'Prog 1',
      days: [5, 6],
      room_id: resources[Math.floor(Math.random() * resources.length)].id,
      session_duration: 2.5,
      session_start_time: {
        hour: 7,
        minute: 30,
        second: 0,
      },
    },
    {
      id: 2,
      code: 'Prog 2',
      hours_per_day: 1,
      days: [1, 3, 5],
      room_id: resources[Math.floor(Math.random() * resources.length)].id,
      session_duration: 1,
      session_start_time: {
        hour: 8,
        minute: 30,
        second: 0,
      },
    }
  ];

  const slots = (day) => {
    // Array to hold all Fridays
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


  const shit = [];

  subjectClasses.forEach((subjectClass) => {
    subjectClass.days.forEach((day) => {
      const slotsByDay = slots(day);
      console.log('dave', slotsByDay);

      const { hour, minute, second } = subjectClass.session_start_time;

      slotsByDay.forEach((slot) => {
        const s = slot.clone().set({ hour, minute, second});
        const e = s.clone().add(subjectClass.session_duration, 'hours');
        shit.push({
          id: subjectClass.id,
          title: subjectClass.code,
          start: s.toDate(),
          end: e.toDate(),
          resourceId: resources.find((resource) => resource.id == subjectClass.room_id).id,
        });
      });
    });
  });

  const CustomResourceView = ({ date, events }) => {
    // Specify the custom start and end date for the view
    const customStart = new Date(2023, 10, 1);  // November 1, 2023
    const customEnd = new Date(2023, 10, 7);   // November 7, 2023
    
    // Filter events within the custom date range
    const filteredEvents = events.filter(event =>
      event.start >= customStart && event.end <= customEnd
    );
  
    return (
      <div>
        <h2>{`Custom Resource View from ${customStart.toLocaleDateString()} to ${customEnd.toLocaleDateString()}`}</h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {resources.map(resource => {
            // Collect events for the current resource
            const resourceEvents = filteredEvents.filter(event => event.resourceId === resource.id);
            return (
              <div key={resource.id}>
                <h3>{resource.title}</h3>
                <div style={{ height: '100px', border: '1px solid #ccc', marginBottom: '10px' }}>
                  {resourceEvents.map(event => (
                    <div key={event.id}>
                      <strong>{event.title}</strong>
                      <p>{`${event.start.toLocaleTimeString()} - ${event.end.toLocaleTimeString()}`}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const [events, setEvents] = useState(shit);

  console.log(events);

  const minTime = new Date(0, 0, 0, 9, 0); // 9:00 AM
  const maxTime = new Date(0, 0, 0, 18, 0); // 6:00 PM


  return (
    <Box sx={{ height: "80vh" }}>
      <CalendarDragAndDrop
        selectable
        components={{
          event: ({ title, event }, x) => {
            console.log(title, event, x);
            return <Box display="flex" alignItems="center">
              <Typography variant="caption">{title}</Typography>
              <Tooltip title="dave">
                <Info/>
              </Tooltip>
            </Box>;
          },
          resourceHeader: ({ resource }) => {
            console.log(resource);
            const { code, name } = resource;
            return <Box padding={2}>
              <Typography>{code}</Typography>
              <Typography variant="caption">{name}</Typography>
              
            </Box>;
          },
        }}
        defaultDate={defaultDate}
        defaultView={Views.DAY}
        events={events}
        localizer={localizer}
        max={maxTime}
        min={minTime}
        maxDate={endDate}
        minDate={startDate}
        resources={resources}
        // resourceIdAccessor="id"
        // resourceTitleAccessor="code"
        startAccessor={"start"}
        endAccessor={"end"}
      />
    </Box>
  );
};

SchedulerWidget.propTypes = {
  startDate: PropTypes.isRequired,
  endDate: PropTypes.isRequired,
  resources: PropTypes.array.isRequired,
};

export default SchedulerWidget;