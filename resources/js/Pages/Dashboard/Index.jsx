import MainLayout from "../../MainLayout";
import React, {  } from 'react';
import { usePage } from '@inertiajs/react';
import SchedulerCalendar from "../../Components/Scheduler/SchedulerCalendar";

const Index = ({ default_academic_year_schedule_id: defaultAcademicYearScheduleId }) => {
    const { auth } = usePage().props;
    const { token } = auth;

    return <SchedulerCalendar academicYearScheduleId={defaultAcademicYearScheduleId} token={token} />;
};

Index.layout = page => <MainLayout children={page} title="Dashboard" />;

export default Index;