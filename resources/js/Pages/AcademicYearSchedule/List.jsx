import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import MainLayout from "../../MainLayout";
import { Alert, Box, Button, Divider, Grid, MenuItem, Paper, TextField, Tooltip, Typography } from "@mui/material";
import React, { useEffect, useState } from 'react';
import { router, usePage } from "@inertiajs/react";
import { DatePicker } from "@mui/x-date-pickers";
import moment from "moment";
import { AccountTree, CalendarMonth, FolderOpen } from "@mui/icons-material";
import PageHeader from "../../Components/Common/PageHeader";

const List = ({ academicYearSchedules, errors }) => {
    const { auth: { roles: authUserRoles } } = usePage().props;

    const [academicYearStart, setAcademicYearStart] = useState(null);
    const [academicYearStartDate, setAcademicYearStartDate] = useState(null);
    const [academicYearEnd, setAcademicYearEnd] = useState(null);
    const [academicYearEndDate, setAcademicYearEndDate] = useState(null);
    const [semesterId, setSemesterId] = useState("1");

    const [paginationModel, setPaginationModel] = React.useState({
        page: academicYearSchedules?.meta ? academicYearSchedules.meta.current_page - 1 : 0,
        pageSize: academicYearSchedules?.meta?.per_page || -1,
    });

    const rowCountRef = React.useRef(academicYearSchedules?.meta?.total || academicYearSchedules.data.length || 0);

    const rowCount = React.useMemo(() => {
        if (academicYearSchedules?.meta?.total !== undefined) {
            rowCountRef.current = academicYearSchedules.meta.total;
        }
        return rowCountRef.current;
    }, [academicYearSchedules?.meta?.total]);

    const handlePaginationChange = (newPaginationModel) => {
        router.get('/academic-year-schedules', {
            page: newPaginationModel.page + 1,
            per_page: newPaginationModel.pageSize,
        }, {
            preserveScroll: true,
            onSuccess: () => setPaginationModel(newPaginationModel),
        });
    };

    const handleCreate = () => {
        router.post('/academic-year-schedules', {
            academic_year: academicYearStart && academicYearEnd ? `${academicYearStart.year()}-${academicYearEnd.year()}` : null,
            start_date: academicYearStartDate.format("YYYY-MM-DD"),
            end_date: academicYearEndDate.format("YYYY-MM-DD"),
            semester_id: semesterId,
        }, {
            preserveScroll: true,
            onSuccess: () => setPaginationModel(paginationModel),
        });
    };

    const columns = [
        {
            field: 'academic_year',
            flex: 0.5,
            headerName: 'Academic Year',
        },
        {
            field: 'semester',
            flex: 0.5,
            headerName: 'Semester',
            renderCell: (params) => {
                return params.row.semester?.title || 'N/A';
            },
        },
        {
            field: 'start_date',
            flex: 0.75,
            headerName: 'Start Date',
            renderCell: (params) => {
                return moment(params.row.start_date).format("DD MMM YYYY");
            },
        },
        {
            field: 'end_date',
            flex: 0.75,
            headerName: 'End Date',
            renderCell: (params) => {
                return moment(params.row.end_date).format("DD MMM YYYY");
            },
        },
        {
            field: 'is_active',
            flex: 0.25,
            headerName: 'Status',
            renderCell: (params) => (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                    }}
                >
                    <Typography variant="body2" color={params.value ? "green" : "red"}>
                        {params.value ? "Active" : "Inactive"}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'subject_classes_count',
            flex: 0.25,
            headerName: 'Subject Classes',
        },
        {
            field: 'actions',
            type: 'actions',
            flex: 0.5,
            getActions: (params) => [
                <GridActionsCellItem
                    label="Open"
                    icon={<FolderOpen />}
                    onClick={() => router.visit(`/academic-year-schedules/${params.row.id}`)}
                    showInMenu={false}
                />,
                <GridActionsCellItem
                    label="Scheduler"
                    icon={<CalendarMonth />}
                    onClick={() => {
                        window.localStorage.setItem('academic-year-schedule-id', params.row.id);
                        router.visit('/dashboard');
                    }}
                    showInMenu={false}
                />,
                <Tooltip title="View Faculty Loadings Summary">
                    <GridActionsCellItem
                        label="Faculty Loadings"
                        icon={<AccountTree />}
                        onClick={() => router.visit(`/academic-year-schedules/${params.row.id}/faculty-loadings`)}
                        showInMenu={false}
                    />
                </Tooltip>,
            ],
        },

    ];

    useEffect(() => {
        if (academicYearStart) {
            setAcademicYearEnd(academicYearStart.add(1, 'year'));
        } else {
            setAcademicYearEnd(null);
        }
    }, []);

    useEffect(() => {
        if (academicYearStart) {
            setAcademicYearEnd(academicYearStart.add(1, 'year'));
        } else {
            setAcademicYearEnd(null);
        }
    }, [academicYearStart]);

    return (<Box>
        <PageHeader title="Academic Schedules" />
        <Grid container spacing={2}>
            <Grid size={['Super Admin'].some(role => authUserRoles.includes(role)) ? 9 : 12}>
                <DataGrid
                    columns={columns}
                    density="compact"
                    onPaginationModelChange={handlePaginationChange}
                    pageSizeOptions={[5, 10, 15]}
                    paginationMode="server"
                    paginationModel={paginationModel}
                    rowCount={rowCount}
                    rows={academicYearSchedules.data}
                    disableColumnMenu
                />
            </Grid>
            {['Super Admin'].some(role => authUserRoles.includes(role)) && <Grid size={3}>
                <Paper sx={{ marginBottom: 2, padding: 2 }}>
                    <Typography variant="h6">New Academic Schedule</Typography>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={1}>
                        <Grid size={6}>
                            <DatePicker
                                label="A.Y. Start"
                                defaultValue={academicYearStart}
                                onChange={(value) => {
                                    if (value) {
                                        setAcademicYearStart(value);
                                    } else {
                                        setAcademicYearStart(null);
                                    }
                                }}
                                renderInput={(params) => <TextField
                                    {...params}
                                    size="small" />}
                                sx={{ mb: 2, width: "100%" }}
                                views={['year']}
                            />
                        </Grid>
                        <Grid size={6}>
                            <DatePicker
                                key={`academic-year-start-date-${academicYearStart ?? ''}`}
                                label="Start Date"
                                disabled={!academicYearStart}
                                minDate={academicYearStart ? academicYearStart.startOf('year') : null}
                                maxDate={academicYearEnd ? academicYearEnd.endOf('year') : null}
                                onChange={(value) => {
                                    if (value) {
                                        setAcademicYearStartDate(value);
                                    } else {
                                        setAcademicYearStartDate(null);
                                    }
                                }}
                                referenceDate={academicYearStart ?? null}
                                renderInput={(params) => <TextField
                                    {...params}
                                    size="small" />}
                                sx={{ mb: 2, width: "100%" }}
                                views={['month', 'day']}
                            />
                        </Grid>
                    </Grid>

                    <Grid container spacing={1}>
                        <Grid size={6}>
                            <DatePicker
                                key={`academic-year-end-${academicYearEnd ?? ''}`}
                                readOnly
                                label="A.Y. End"
                                defaultValue={academicYearEnd}
                                renderInput={(params) => <TextField
                                    {...params}
                                    size="small" />}
                                sx={{ mb: 2, width: "100%" }}
                                views={['year']}
                            />
                        </Grid>
                        <Grid size={6}>
                            <DatePicker
                                label="End Date"
                                key={`academic-year-end-date-${academicYearEnd ?? ''}`}
                                disabled={!academicYearEnd || !academicYearStartDate}
                                minDate={academicYearStartDate ?? null}
                                maxDate={academicYearEnd ? academicYearEnd.endOf('year') : null}
                                onChange={(value) => {
                                    if (value) {
                                        setAcademicYearEndDate(value);
                                    } else {
                                        setAcademicYearEndDate(null);
                                    }
                                }}
                                referenceDate={academicYearStart ?? null}
                                renderInput={(params) => <TextField
                                    {...params}
                                    size="small" />}
                                sx={{ mb: 2, width: "100%" }}
                                views={['month', 'day']}
                            />
                        </Grid>
                    </Grid>


                    <TextField
                        fullWidth
                        required
                        select
                        defaultValue={semesterId ?? "1"}
                        label="Semester"
                        onChange={(e) => {
                            setSemesterId(e.target.value);
                        }}
                        size="small"
                        sx={{ mb: 2 }}
                    >
                        <MenuItem value="1">1st Semester</MenuItem>
                        <MenuItem value="2">2nd Semester</MenuItem>
                        <MenuItem value="3">3rd Semester</MenuItem>
                    </TextField>
                    {errors?.academic_year && <Alert sx={{ mb: 2 }} severity="error">{errors?.academic_year}</Alert>}
                    <Divider sx={{ mb: 2 }} />
                    <Button fullWidth variant="contained" onClick={handleCreate}>Create</Button>
                </Paper>
            </Grid>}
        </Grid>
    </Box>);
};

List.layout = page => <MainLayout children={page} title="Academic Year Schedules" />;

export default List;