import MainLayout from "../../MainLayout";
import React, { useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { Autocomplete, Box, TextField, Typography } from "@mui/material";
import SchedulerWidget from "../../Components/SchedulerWidget";
import moment from "moment";

const Index = ({
    academicYearSchedule,
    currFilters,
    departments,
    rooms
}) => {
    const { auth } = usePage().props;
    const { roles } = auth;

    const {
        semester,
        academic_year: academicYear,
        start_date: academicYearScheduleStartDate,
        end_date: academicYearScheduleEndDate,
        subject_classes: subjectClasses,
    } = academicYearSchedule?.data ?? {};

    const { title: semesterTitle } = semester ?? {};

    const filters = useRef(currFilters);

    const handleFilters = () => {
        router.get(
            window.location.href,
            { filters: filters.current },
            {
                preserveScroll: true,
            }
        );
    };

    return <>
        {academicYearSchedule && <>
            <Box>
                <Typography>Filters</Typography>
                <Autocomplete
                    disablePortal
                    defaultValue={departments.data.find((department) => department.id == filters.current?.department) ?? null}
                    getOptionLabel={(option) => `${option.code} - ${option.title}`}
                    options={departments.data}
                    onChange={(_event, value) => {
                        filters.current = {
                            ...filters.current,
                            department: value?.id,
                            room: null,
                        };
                        handleFilters();
                    }}
                    renderInput={(params) => <TextField {...params} label="Department" />}
                />
                <Autocomplete
                    disablePortal
                    defaultValue={rooms.data.find((room) => room.id == filters.current?.room) ?? null}
                    getOptionLabel={(option) => `${option.code} - ${option.name}`}
                    options={rooms.data}
                    onChange={(_event, value) => {
                        filters.current = {
                            ...filters.current,
                            room: value?.id,
                        };
                        handleFilters();
                    }}
                    renderInput={(params) => <TextField {...params} label="Room" />}
                />
            </Box>
            <SchedulerWidget
                academicYear={academicYear}
                semester={semesterTitle}
                startDate={moment(academicYearScheduleStartDate)}
                endDate={moment(academicYearScheduleEndDate)}
                subjectClasses={subjectClasses}
                resources={rooms.data.filter((room) => filters.current?.room ? room.id == filters.current?.room : true)}
            />
        </>}
    </>;
};

Index.layout = page => <MainLayout children={page} title="Dashboard" />;

export default Index;