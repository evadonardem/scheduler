import { DataGrid, GridToolbarContainer, GridToolbarExport } from "@mui/x-data-grid";
import MainLayout from "../../MainLayout";
import { Box, Button, Grid, Link, Paper, Stack, styled } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import React from 'react';
import { router, usePage } from "@inertiajs/react";
import PageHeader from "../../Components/Common/PageHeader";
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

const List = ({ departments }) => {
    const { auth: { roles: authUserRoles } } = usePage().props;

    const [paginationModel, setPaginationModel] = React.useState({
        page: departments?.meta ? departments.meta.current_page - 1 : 0,
        pageSize: departments?.meta?.per_page || -1,
    });

    const rowCountRef = React.useRef(departments?.meta?.total || departments.data.length || 0);

    const rowCount = React.useMemo(() => {
        if (departments?.meta?.total !== undefined) {
            rowCountRef.current = departments.meta.total;
        }
        return rowCountRef.current;
    }, [departments?.meta?.total]);

    const handlePaginationChange = (newPaginationModel) => {
        router.get('/departments', {
            page: newPaginationModel.page + 1,
            per_page: newPaginationModel.pageSize,
        }, {
            preserveScroll: true,
            onSuccess: () => setPaginationModel(newPaginationModel),
        });
    };

    const columns = [
        {
            field: 'code',
            flex: 0.25,
            headerName: 'Code',
        },
        {
            field: 'title',
            flex: 1,
            headerName: 'Title',
        },
    ];

    const handleImport = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(formData.entries());
        router.post(`/departments`, formJson, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    return (
        <React.Fragment>
            <PageHeader title="Departments" />
            <Grid container spacing={2}>
                <Grid size={!['Super Admin'].some(role => includes(authUserRoles, role)) ? 12 : 9}>
                    <DataGrid
                        columns={columns}
                        density="compact"
                        onPaginationModelChange={handlePaginationChange}
                        pageSizeOptions={[5, 10, 15, { label: 'All', value: -1 }]}
                        paginationMode="server"
                        paginationModel={paginationModel}
                        rowCount={rowCount}
                        rows={departments.data}
                        slots={{ toolbar: CustomToolbar }}
                        disableColumnMenu
                    />
                </Grid>
                {['Super Admin'].some(role => includes(authUserRoles, role)) && <React.Fragment>
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
                                        Upload Departments
                                        <VisuallyHiddenInput type="file" name="departments" />
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                    >
                                        Import
                                    </Button>
                                </Stack>
                            </Box>
                            <Link
                                href="/import-templates/departments"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Dowload Template
                            </Link>
                        </Paper>
                    </Grid>
                </React.Fragment>}
            </Grid>


        </React.Fragment>
    );
};

List.layout = page => <MainLayout children={page} title="Departments" />;

export default List;