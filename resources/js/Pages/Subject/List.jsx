import { DataGrid, GridToolbarContainer, GridToolbarExport } from "@mui/x-data-grid";
import MainLayout from "../../MainLayout";
import { Box, Button, Link, Paper, Stack, styled } from "@mui/material";
import { CloudUpload } from "@mui/icons-material";
import React from 'react';
import { router } from "@inertiajs/react";

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
        router.get('/subjects', {
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
        const formJson = Object.fromEntries(formData.entries());
        console.log(formJson);
        router.post(`/subjects`, formJson, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    return (
        <>
            <Paper sx={{ marginBottom: 2, padding: 2, width: '25%' }}>
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
            </Paper>
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
        </>
    );
};

List.layout = page => <MainLayout children={page} title="Subjects" />;

export default List;