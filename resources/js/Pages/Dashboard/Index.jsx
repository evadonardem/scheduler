import MainLayout from "../../MainLayout";
import React, { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Typography } from "@mui/material";
import SchedulerWidget from "../../Components/SchedulerWidget";
import moment from "moment";

const Index = ({ academic_year_start_date, academic_year_end_date, timezone, rooms }) => {
    const { auth } = usePage().props;
    const { roles } = auth;

    console.log(academic_year_start_date, academic_year_end_date);

    return <>
        <Typography>Under construction...</Typography>
        <SchedulerWidget
            startDate={moment(academic_year_start_date)}
            endDate={moment(academic_year_end_date)}
            timezone={timezone}
            resources={rooms.data}
        />
    </>;
};

Index.layout = page => <MainLayout children={page} title="Dashboard" />;

export default Index;