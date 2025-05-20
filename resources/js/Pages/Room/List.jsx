import { DataGrid, GridToolbarContainer, GridToolbarExport } from "@mui/x-data-grid";
import MainLayout from "../../MainLayout";
import { Box, Button, Divider, Grid, Link, Paper, Stack, styled, TextField } from "@mui/material";
import { Check, CloudUpload, Search } from "@mui/icons-material";
import React, { } from 'react';
import { router } from "@inertiajs/react";
import PageHeader from "../../Components/Common/PageHeader";
import { debounce } from "lodash";

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
    const queryParams = new URLSearchParams(window.location.search);
    const searchKeyParam = queryParams.get('searchKey');

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
        let params = {
            page: newPaginationModel.page + 1,
            per_page: newPaginationModel.pageSize,
        };
        if (searchKeyParam) {
            params = { ...params, searchKey: searchKeyParam };
        }
        router.get('/rooms', params, {
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
                return !!cell.value && <Check />;
            }
        },
        {
            field: 'is_lab',
            flex: 0.125,
            headerName: 'Is Lab?',
            sortable: false,
            renderCell: (cell) => {
                return !!cell.value && <Check />;
            }
        },
        {
            field: 'department',
            flex: 0.5,
            headerName: 'Department Owner',
            sortable: false,
            valueGetter: (department) => {
                const { code, title } = department;
                return `${code} - ${title}`;
            },
        }
    ];

    const handleImport = (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const formJson = Object.fromEntries(formData.entries());
        router.post(`/rooms`, formJson, {
            preserveScroll: true,
            preserveState: false,
        });
    };

    const debouncedQuickSearch = React.useMemo(
        () => debounce((newSearchKey, paginationModel) => {
            let params = {
                page: paginationModel.page + 1,
                per_page: paginationModel.pageSize,
            };
            if (newSearchKey) {
                params = { ...params, searchKey: newSearchKey };
            }
            router.get('/rooms', params, { preserveScroll: true });
        }, 400),
        [paginationModel]
    );

    const handleQuickSearch = (event) => {
        debouncedQuickSearch(event.currentTarget.value, paginationModel);
    };

    return (
        <React.Fragment>
            <PageHeader title="Rooms" />
            <Grid container spacing={2}>
                <Grid size={9}>
                    <TextField
                        fullWidth
                        defaultValue={searchKeyParam}
                        placeholder="Quick search room code/name"
                        size="small"
                        slotProps={{
                            input: {
                                startAdornment: <Search />
                            }
                        }}
                        inputRef={input => {
                            if (input) {
                                input.focus();
                            }
                        }}
                        onChange={handleQuickSearch}
                    />
                    <Divider sx={{ my: 2 }} />
                    <Box>
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
                    </Box>
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
                </Grid>
            </Grid>
        </React.Fragment>
    );
};

List.layout = page => <MainLayout children={page} title="Rooms" />;

export default List;