import { DataGrid, GridToolbarContainer, GridToolbarExport } from "@mui/x-data-grid";
import MainLayout from "../../MainLayout";
import { Box, Button, Grid, Link, Paper, Stack, styled } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import React, { useEffect } from 'react';
import { router, usePage } from "@inertiajs/react";
import PageHeader from "../../Components/Common/PageHeader";
import AutocompleteDepartment from "../../Components/Common/AutocompleteDepartment";
import { includes } from "lodash";

const CustomToolbar = () => <GridToolbarContainer>
    <GridToolbarExport printOptions={{ disableToolbarButton: true }} />
</GridToolbarContainer>;

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

const List = ({ errors, courses }) => {
    const [paginationModel, setPaginationModel] = React.useState({
        page: courses?.meta ? courses.meta.current_page - 1 : 0,
        pageSize: courses?.meta?.per_page || -1,
    });

    const rowCountRef = React.useRef(courses?.meta?.total || courses.data.length || 0);

    const rowCount = React.useMemo(() => {
        if (courses?.meta?.total !== undefined) {
            rowCountRef.current = courses.meta.total;
        }
        return rowCountRef.current;
    }, [courses?.meta?.total]);

    const handlePaginationChange = (newPaginationModel) => {
        let params = {
            page: newPaginationModel.page + 1,
            per_page: newPaginationModel.pageSize,
        };

        if (
            includes(authUserRoles, 'Super Admin') &&
            selectedDepartmentId
        ) {
            params = {
                ...params,
                filters: {
                    department: { id: selectedDepartmentId }
                }
            };
        }

        router.get('/courses', params, {
            preserveScroll: true,
            onSuccess: () => setPaginationModel(newPaginationModel),
        });
    };

    const { auth: { department: authUserDepartment, roles: authUserRoles } } = usePage().props;

    const queryParams = new URLSearchParams(window.location.search);
    const departmentParam = queryParams.get('filters[department][id]');

    const defaultDepartmentId = departmentParam ?? (!includes(authUserRoles, 'Super Admin') ? authUserDepartment?.id : null);
    const [selectedDepartmentId, setSelectedDepartmentId] = React.useState(defaultDepartmentId ?? null);


    const columns = [
        {
            field: 'code',
            flex: 0.25,
            headerName: 'Code',
            sortable: false,
        },
        {
            field: 'title',
            flex: 0.5,
            headerName: 'Title',
            sortable: false,
        },
        {
            field: 'department',
            flex: 0.5,
            headerName: 'Department',
            sortable: false,
            valueGetter: (department) => `${department.code} - ${department.title}`,
        }
    ];

    const handleImport = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        let formJson = Object.fromEntries(formData.entries());
        formJson = { ...formJson, department_id: selectedDepartmentId };
        router.post(`/courses`, formJson, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    const handleChangeDepartment = (department) => {
        setSelectedDepartmentId(department?.id);

        let params = {
            page: paginationModel.page + 1,
            per_page: paginationModel.pageSize,
        };

        if (department) {
            params = {
                ...params,
                filters: {
                    department: { id: department?.id }
                }
            };
        }

        router.get('/courses', params, {
            preserveScroll: true,
        });
    };

    useEffect(() => {
        if (departmentParam && !includes(authUserRoles, 'Super Admin')) {
            window.location.replace('/subjects');
        }
    }, []);


    return (
        <React.Fragment>
            <PageHeader title="Courses" />
            <Grid container spacing={2}>
                <Grid size={9}>
                    <DataGrid
                        columns={columns}
                        density="compact"
                        onPaginationModelChange={handlePaginationChange}
                        pageSizeOptions={[5, 10, 15, { label: 'All', value: -1 }]}
                        paginationMode="server"
                        paginationModel={paginationModel}
                        rowCount={rowCount}
                        rows={courses.data}
                        slots={{ toolbar: CustomToolbar }}
                        disableColumnMenu
                    />
                </Grid>
                <Grid size={3}>
                    <Paper sx={{ marginBottom: 2, padding: 2 }}>
                        <AutocompleteDepartment
                            key={`selected-department-${selectedDepartmentId ?? 0}`}
                            defaultDepartmentId={selectedDepartmentId}
                            readOnly={!includes(authUserRoles, 'Super Admin')}
                            onChange={handleChangeDepartment}
                        />

                        {selectedDepartmentId && <React.Fragment>
                            <Box component="form" marginBottom={2} onSubmit={handleImport}>
                                <Stack spacing={2}>
                                    <Button
                                        component="label"
                                        role={undefined}
                                        variant="outlined"
                                        tabIndex={-1}
                                        startIcon={<CloudUpload />}
                                        onSubmit={handleImport}
                                    >
                                        Upload Courses
                                        <VisuallyHiddenInput type="file" name="courses" />
                                    </Button>
                                    {!!errors.courses ? <p style={{ color: 'red' }}>{errors.courses}</p> : null}
                                    <Button
                                        type="submit"
                                        variant="contained"
                                    >
                                        Import
                                    </Button>
                                </Stack>
                            </Box>
                            <Link
                                href="/import-templates/courses"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Dowload Template
                            </Link>
                        </React.Fragment>}
                    </Paper>
                </Grid>
            </Grid>
        </React.Fragment>
    );
};

List.layout = page => <MainLayout children={page} title="Courses" />;

export default List;