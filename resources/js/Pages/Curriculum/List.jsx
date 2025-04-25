import { DataGrid, GridActionsCellItem, GridToolbarContainer, GridToolbarExport } from "@mui/x-data-grid";
import MainLayout from "../../MainLayout";
import { Box, Button, Link, Paper, Stack, styled } from "@mui/material";
import { CloudUpload, FolderOpen } from "@mui/icons-material";
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

const List = ({ errors, curricula }) => {
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
        router.get('/curricula', {
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
            headerName: 'Code',
            flex: 0.25,
            sortable: false,
        },
        {
            field: 'description',
            headerName: 'Description',
            flex: 1,
            sortable: false,
        },
        {
            field: 'course',
            headerName: 'Course',
            flex: 0.25,
            sortable: false,
            valueGetter: (course) => `${course.code} - ${course.title}`,
        },
        {
            field: 'actions',
            type: 'actions',
            getActions: (params) => {

                return [
                    <GridActionsCellItem
                        icon={<FolderOpen />}
                    />
                ];
            }
        }
    ];

    const handleImport = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(formData.entries());
        console.log(formJson);
        router.post(`/curricula`, formJson, {
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
                            Upload Curricula
                            <VisuallyHiddenInput type="file" name="curricula" />
                        </Button>
                        {!!errors.curricula ? <p style={{ color: 'red' }}>{errors.curricula}</p> : null}
                        <Button
                            type="submit"
                            variant="contained"
                        >
                            Import
                        </Button>
                    </Stack>
                </Box>
                <Link
                    href="/import-templates/curricula"
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
                rows={curricula.data}
                slots={{ toolbar: CustomToolbar }}
                disableColumnMenu
            />
        </>
    );
};

List.layout = page => <MainLayout children={page} title="Curricula" />;

export default List;