import { DataGrid, GridToolbarContainer, GridToolbarExport } from "@mui/x-data-grid";
import MainLayout from "../../MainLayout";
import { Box, Button, Link, Paper, Stack, styled } from "@mui/material";
import { Check, CloudUpload } from "@mui/icons-material";
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

const List = ({ errors, rooms }) => {
    const [paginationModel, setPaginationModel] = React.useState({
        page: rooms?.meta ? rooms.meta.current_page - 1 : 0,
        pageSize: rooms?.meta?.per_page || -1,
    });

    const rowCountRef = React.useRef(rooms?.meta?.total || rooms.data.length || 0);

    const rowCount = React.useMemo(() => {
        if (rooms?.meta?.total !== undefined) {
            rowCountRef.current = rooms.meta.total;
        }
        return rowCountRef.current;
    }, [rooms?.meta?.total]);

    const handlePaginationChange = (newPaginationModel) => {
        router.get('/rooms', {
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
            field: 'name',
            flex: 0.5,
            headerName: 'Name',
            sortable: false,
        },
        {
            field: 'is_lec',
            flex: 0.125,
            headerName: 'Is Lec?',
            sortable: false,
            renderCell: (cell) => {
                return !!cell.value && <Check/>;
            }
        },
        {
            field: 'is_lab',
            flex: 0.125,
            headerName: 'Is Lab?',
            sortable: false,
            renderCell: (cell) => {
                return !!cell.value && <Check/>;
            }
        },
        {
            field: 'department_owner',
            flex: 0.5,
            headerName: 'Department Owner',
            sortable: false,
        }
    ];

    const handleImport = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(formData.entries());
        console.log(formJson);
        router.post(`/rooms`, formJson, {
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
                            Upload Rooms
                            <VisuallyHiddenInput type="file" name="rooms" />
                        </Button>
                        {!!errors.rooms ? <p style={{ color: 'red' }}>{errors.rooms}</p> : null}
                        <Button
                            type="submit"
                            variant="contained"
                        >
                            Import
                        </Button>
                    </Stack>
                </Box>
                <Link
                    href="/import-templates/rooms"
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
                rows={rooms.data}
                slots={{ toolbar: CustomToolbar }}
                disableColumnMenu
            />
        </>
    );
};

List.layout = page => <MainLayout children={page} title="Rooms" />;

export default List;