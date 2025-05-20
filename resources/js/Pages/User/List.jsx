import { DataGrid, GridToolbarContainer, GridToolbarExport } from "@mui/x-data-grid";
import MainLayout from "../../MainLayout";
import { Box, Button, Grid, Link, Paper, Stack, styled } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import React from 'react';
import { router } from "@inertiajs/react";
import PageHeader from "../../Components/Common/PageHeader";

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

const List = ({ errors, users }) => {
    const [paginationModel, setPaginationModel] = React.useState({
        page: users?.meta ? users.meta.current_page - 1 : 0,
        pageSize: users?.meta?.per_page || -1,
    });

    const rowCountRef = React.useRef(users?.meta?.total || users.data.length || 0);

    const rowCount = React.useMemo(() => {
        if (users?.meta?.total !== undefined) {
            rowCountRef.current = users.meta.total;
        }
        return rowCountRef.current;
    }, [users?.meta?.total]);

    const handlePaginationChange = (newPaginationModel) => {
        router.get('/users', {
            page: newPaginationModel.page + 1,
            per_page: newPaginationModel.pageSize,
        }, {
            preserveScroll: true,
            onSuccess: () => setPaginationModel(newPaginationModel),
        });
    };

    const columns = [
        {
            field: 'institution_id',
            flex: 0.5,
            headerName: 'ID',
            sortable: false,
        },
        {
            field: 'last_name',
            flex: 0.5,
            headerName: 'Last Name',
            sortable: false,
        },
        {
            field: 'first_name',
            flex: 0.5,
            headerName: 'First Name',
            sortable: false,
        },
        {
            field: 'gender',
            flex: 0.25,
            headerName: 'Gender',
            sortable: false,
        },
        {
            field: 'email',
            flex: 1,
            headerName: 'Email',
            sortable: false,
        },
        {
            field: 'department',
            flex: 1,
            headerName: 'Department',
            sortable: false,
            valueGetter: (department) => department
                ? `${department.code} - ${department.title}`
                : '-',
        },
        {
            field: 'roles',
            flex: 0.5,
            headerName: 'Roles',
            sortable: false,
            valueGetter: (roles) => roles
                ? `${roles.join(', ')}`
                : '-',
        }
    ];

    const handleImport = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(formData.entries());
        router.post(`/users`, formJson, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    return (
        <React.Fragment>
            <PageHeader title="Users" />
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
                        rows={users.data}
                        slots={{ toolbar: CustomToolbar }}
                        disableColumnMenu
                    />
                </Grid>
                <Grid size={3}>
                    <Paper sx={{ marginBottom: 2, padding: 2 }}>
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
                                    Upload Users
                                    <VisuallyHiddenInput type="file" name="users" />
                                </Button>
                                {!!errors.users ? <p style={{ color: 'red' }}>{errors.users}</p> : null}
                                <Button
                                    type="submit"
                                    variant="contained"
                                >
                                    Import
                                </Button>
                            </Stack>
                        </Box>
                        <Link
                            href="/import-templates/users"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            Dowload Template
                        </Link>
                    </Paper>
                </Grid>
            </Grid>
        </React.Fragment>
    );
};

List.layout = page => <MainLayout children={page} title="Users" />;

export default List;