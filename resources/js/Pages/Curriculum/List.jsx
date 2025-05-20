import { DataGrid, GridActionsCellItem } from "@mui/x-data-grid";
import MainLayout from "../../MainLayout";
import { Alert, Box, Button, Divider, Grid, Paper, styled, TextField, Typography } from "@mui/material";
import { Delete, FolderOpen } from "@mui/icons-material";
import React, { useEffect } from 'react';
import { router, useForm, usePage } from "@inertiajs/react";
import PageHeader from "../../Components/Common/PageHeader";
import AutocompleteDepartment from "../../Components/Common/AutocompleteDepartment";
import { includes } from "lodash";
import AutocompleteCourse from "../../Components/Common/AutocompleteCourse";

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

const List = ({ curricula }) => {
    const { auth: { token, department: authUserDepartment, roles: authUserRoles } } = usePage().props;

    const queryParams = new URLSearchParams(window.location.search);
    const departmentParam = queryParams.get('department');

    const defaultDepartmentId = departmentParam ?? (!includes(authUserRoles, 'Super Admin') ? authUserDepartment?.id : null);
    const [selectedDepartmentId, setSelectedDepartmentId] = React.useState(defaultDepartmentId ?? null);

    const [paginationModel, setPaginationModel] = React.useState({
        page: curricula?.meta ? curricula.meta.current_page - 1 : 0,
        pageSize: curricula?.meta?.per_page || -1,
    });

    const rowCountRef = React.useRef(curricula?.meta?.total || curricula.data.length || 0);

    const rowCount = React.useMemo(() => {
        if (curricula?.meta?.total !== undefined) {
            rowCountRef.current = curricula.meta.total;
        }
        return rowCountRef.current;
    }, [curricula?.meta?.total]);

    const handlePaginationChange = (newPaginationModel) => {
        let params = {
            page: newPaginationModel.page + 1,
            per_page: newPaginationModel.pageSize,
        };

        if (selectedDepartmentId) {
            params = {
                ...params,
                department: selectedDepartmentId,
            };
        }

        router.get('/curricula', params, {
            preserveScroll: true,
            onSuccess: () => setPaginationModel(newPaginationModel),
        });
    };

    const { data, setData, post, errors, reset } = useForm({
        department: null,
        course: null,
        code: null,
        description: null,
    });

    let columns = [
        {
            field: 'code',
            headerName: 'Code',
            flex: 0.125,
            sortable: false,
        },
        {
            field: 'description',
            headerName: 'Description',
            flex: 0.75,
            sortable: false,
        },
        {
            field: 'course',
            headerName: 'Course',
            flex: 0.5,
            sortable: false,
            valueGetter: (course) => `${course.code} - ${course.title}`,
        },
    ];

    if (!!!selectedDepartmentId) {
        columns = [
            ...columns,
            {
                field: 'deparment',
                headerName: 'Department',
                flex: 0.125,
                sortable: false,
                valueGetter: (_value, row) => {
                    return row.course.department;
                },
                valueFormatter: (department) => department.code,
            },
        ];
    }

    columns = [
        ...columns,
        {
            field: 'status',
            headerName: 'Status',
            flex: 0.125,
            sortable: false,
            valueGetter: (_value, row) => {
                let status;
                if (row.is_draft) {
                    status = 'Draft';
                } else {
                    status = row.is_active ? 'Active' : 'Inactive';
                }
                return status;
            },
            renderCell: (params) => {
                let severity;
                if (params.value === 'Draft') {
                    severity = 'warning';
                } else {
                    severity = params.value === 'Active' ? 'success' : 'error';
                }
                return (
                    <Box alignItems="center" width="100%" height="100%">
                        <Alert severity={severity}>{params.value}</Alert>
                    </Box>
                );
            }
        },
        {
            field: 'actions',
            type: 'actions',
            getActions: (params) => {
                const { row: curriculum } = params;
                const {
                    is_draft: isDraft,
                } = curriculum;

                const actions = [
                    <GridActionsCellItem
                        icon={<FolderOpen />}
                        onClick={() => router.visit(`/curricula/${curriculum.id}/subjects`)}
                    />
                ];

                if (isDraft) {
                    actions.push(<GridActionsCellItem
                        icon={<Delete />}
                        onClick={() => router.delete(`/curricula/${curriculum.id}`)}
                    />);
                }

                return actions;
            }
        }
    ];

    const handleOnChangeDepartment = (selectedDepartment) => {
        let params = {
            page: 1,
            per_page: paginationModel.pageSize,
        };

        if (selectedDepartment) {
            params = {
                ...params,
                department: selectedDepartment.id,
            };
        }

        router.get('/curricula', params, {
            preserveScroll: true,
            preserveState: true,
            onSuccess: () => {
                setSelectedDepartmentId(selectedDepartment?.id ?? null);
                setData({ ...data, department: selectedDepartment?.id, course: null });
            },
        });
    };

    useEffect(() => {
        if (departmentParam && !includes(authUserRoles, 'Super Admin')) {
            window.location.replace('/curricula');
        }
        if (selectedDepartmentId) {
            setData({ ...data, department: selectedDepartmentId });
        }
    }, []);

    return (<React.Fragment>
        <PageHeader title="Curricula" />
        <Grid container spacing={2}>
            <Grid size={authUserRoles.some(role => ['Super Admin', 'Dean', 'Associate Dean'].includes(role)) ? 9 : 12}>
                <DataGrid
                    columns={columns}
                    density="compact"
                    onPaginationModelChange={handlePaginationChange}
                    pageSizeOptions={[5, 10, 15, { label: 'All', value: -1 }]}
                    paginationMode="server"
                    paginationModel={paginationModel}
                    rowCount={rowCount}
                    rows={curricula.data}
                    disableColumnMenu
                />
            </Grid>
            {authUserRoles.some(role => ['Super Admin', 'Dean', 'Associate Dean'].includes(role)) && <Grid size={3}>
                <Paper
                    component="form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        post(`/curricula`, {
                            preserveScroll: true,
                            onSuccess: () => {
                                setData({
                                    ...data,
                                    course: null,
                                    code: null,
                                    description: null,
                                });
                            },
                        });
                    }}
                    sx={{ p: 2 }}
                >
                    <Typography variant="h6">Create New Curricullum</Typography>

                    <Divider sx={{ my: 2 }} />

                    <AutocompleteDepartment
                        key={`selected-department-${selectedDepartmentId ?? 0}`}
                        defaultDepartmentId={selectedDepartmentId}
                        error={!!errors?.department}
                        helperText={errors?.department}
                        readOnly={!includes(authUserRoles, 'Super Admin')}
                        onChange={handleOnChangeDepartment}
                    />

                    {selectedDepartmentId && <React.Fragment>
                        <AutocompleteCourse
                            key={`selected-department-${selectedDepartmentId ?? 0}-course-${data.course ?? 0}`}
                            selectedCourseId={data.course}
                            filters={{
                                department: { id: selectedDepartmentId }
                            }}
                            error={!!errors?.course}
                            helperText={errors.course ?? ''}
                            onChange={(course) => setData({ ...data, course: course?.id })}
                        />
                        <TextField
                            key={`code-value-${!!data.code ? 'changed' : 'reset'}`}
                            label="Code"
                            defaultValue={data.code}
                            variant="outlined"
                            size="small"
                            fullWidth
                            placeholder="Code"
                            sx={{ mb: 2 }}
                            error={!!errors?.code}
                            helperText={errors?.code ?? ''}
                            onBlur={(event) => {
                                const value = event.currentTarget.value;
                                setData({
                                    ...data,
                                    code: value,
                                })
                            }}
                        />
                        <TextField
                            key={`description-value-${!!data.code ? 'changed' : 'reset'}`}
                            label="Description"
                            defaultValue={data.description}
                            variant="outlined"
                            size="small"
                            fullWidth
                            placeholder="Description"
                            sx={{ mb: 2 }}
                            error={!!errors?.description}
                            helperText={errors?.description ?? ''}
                            onBlur={(event) => {
                                const value = event.currentTarget.value;
                                setData({
                                    ...data,
                                    description: value,
                                })
                            }}
                        />

                        <Divider sx={{ mb: 2 }} />

                        <Button fullWidth type="submit" variant="contained">Submit</Button>

                    </React.Fragment>}
                </Paper>
            </Grid>}
        </Grid>
    </React.Fragment>);
};

List.layout = page => <MainLayout children={page} title="Curricula" />;

export default List;