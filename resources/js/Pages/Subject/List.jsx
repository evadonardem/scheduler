import { DataGrid, GridActionsCellItem, GridToolbarContainer, GridToolbarExport } from "@mui/x-data-grid";
import MainLayout from "../../MainLayout";
import { Box, Button, Grid, Link, Paper, Stack, styled, Tooltip } from "@mui/material";
import { CloudUpload, Delete } from "@mui/icons-material";
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

const List = ({ errors, subjects }) => {
    const [paginationModel, setPaginationModel] = React.useState({
        page: subjects?.meta ? subjects.meta.current_page - 1 : 0,
        pageSize: subjects?.meta?.per_page || -1,
    });

    const rowCountRef = React.useRef(subjects?.meta?.total || subjects.data.length || 0);

    const rowCount = React.useMemo(() => {
        if (subjects?.meta?.total !== undefined) {
            rowCountRef.current = subjects.meta.total;
        }
        return rowCountRef.current;
    }, [subjects?.meta?.total]);

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

        router.get('/subjects', params, {
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
        },
        {
            field: 'actions',
            type: 'actions',
            flex: 0.5,
            getActions: (params) => {
                const actions = [];
                const { row: subject } = params;
                if (subject.is_deletable) {
                    actions.push(<Tooltip title="Subject Deletable">
                        <GridActionsCellItem
                            label="Delete Subject"
                            icon={<Delete />}
                            onClick={() => router.delete(`/subjects/${subject.id}`)}
                            showInMenu={false}
                        />
                    </Tooltip>);
                }
                return actions;
            },
        },
    ];

    const handleImport = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        let formJson = Object.fromEntries(formData.entries());
        formJson = {...formJson, department_id: selectedDepartmentId };
        router.post(`/subjects`, formJson, {
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

        router.get('/subjects', params, {
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
            <PageHeader title="Subjects" />
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
                        rows={subjects.data}
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
                                        Upload Subjects
                                        <VisuallyHiddenInput type="file" name="subjects" />
                                    </Button>
                                    {!!errors.subjects ? <p style={{ color: 'red' }}>{errors.subjects}</p> : null}
                                    <Button
                                        type="submit"
                                        variant="contained"
                                    >
                                        Import
                                    </Button>
                                </Stack>
                            </Box>
                            <Link
                                href="/import-templates/subjects"
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

List.layout = page => <MainLayout children={page} title="Subjects" />;

export default List;