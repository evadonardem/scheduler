import MainLayout from "../../MainLayout";
import { Box } from "@mui/material";
import React, {  } from 'react';
import moment from "moment";
import PageHeader from "../../Components/Common/PageHeader";
import SchedulerForm from "../../Components/Scheduler/SchedulerForm";

const Show = ({ academicYearSchedule }) => {
    const {
        id: academicYearScheduleId,
        academic_year: academicYear,
        semester: { title: semesterTitle },
        start_date: startDate,
        end_date: endDate,
    } = academicYearSchedule.data;
    const pageTitle = `${semesterTitle} A.Y. ${academicYear}`;
    const pageSubtitle = `${moment(startDate).format("DD MMM YYYY")} to ${moment(endDate).format("DD MMM YYYY")}`;

    return (
        <Box>
            <PageHeader
                title={pageTitle}
                subtitle={pageSubtitle}
                links={[
                    {
                        title: 'Academic Year Schedules',
                        to: '/academic-year-schedules',
                    },
                ]}
            />
            <SchedulerForm academicYearScheduleId={academicYearScheduleId} />
        </Box>
    );
};

Show.layout = page => <MainLayout children={page} title="Academic Year Schedule" />;

export default Show;