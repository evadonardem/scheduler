import MainLayout from "../../MainLayout";
import React, {  } from 'react';
import SchedulerCalendar from "../../Components/Scheduler/SchedulerCalendar";

const Index = ({ default_academic_year_schedule_id: defaultAcademicYearScheduleId }) => {
    return <SchedulerCalendar academicYearScheduleId={defaultAcademicYearScheduleId} />;
};

Index.layout = page => <MainLayout children={page} title="Dashboard" />;

export default Index;