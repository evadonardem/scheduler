import { Box } from "@mui/material";
import React, { } from 'react';
import { usePage } from "@inertiajs/react";
import MainLayout from "../../../MainLayout";
import PageHeader from "../../../Components/Common/PageHeader";
import moment from "moment";
import SchedulerFacultyLoading from "../../../Components/Scheduler/SchedulerFacultyLoading";

const List = ({ academicYearSchedule }) => {
    const { auth: { roles: authUserRoles } } = usePage().props;
    const {
        id: academicYearScheduleId,
        academic_year: academicYear,
        semester: { title: semesterTitle },
        start_date: startDate,
        end_date: endDate,
    } = academicYearSchedule.data;
    const pageTitle = `Faculty Loadings Summary`;
    const pageSubtitle = `${semesterTitle} A.Y. ${academicYear} (${moment(startDate).format("DD MMM YYYY")} to ${moment(endDate).format("DD MMM YYYY")})`;

    return (<Box>
        <PageHeader title={pageTitle} subtitle={pageSubtitle} links={[
            {
                title: 'Academic Year Schedules',
                to: '/academic-year-schedules',
            },
        ]} />
        <SchedulerFacultyLoading academicYearScheduleId={academicYearScheduleId} />
    </Box>);
};

List.layout = page => <MainLayout children={page} title="Academic Year Schedules" />;

export default List;