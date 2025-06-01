import { DataGrid, useGridApiContext } from "@mui/x-data-grid";
import MainLayout from "../../MainLayout";
import { Box, Button, Checkbox, Chip, Divider, Grid, Link, ListItemText, MenuItem, OutlinedInput, Paper, Select, Stack, styled, TextField } from "@mui/material";
import { CloudUpload, Search } from "@mui/icons-material";
import React from 'react';
import { router, usePage } from "@inertiajs/react";
import PageHeader from "../../Components/Common/PageHeader";
import { debounce, includes } from "lodash";
import { isEqual, pickBy } from "lodash";
import axios from "axios";
import AutocompleteDepartment from "../../Components/Common/AutocompleteDepartment";

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

const UserRoleSelect = React.memo(({ row = {} }) => {
    const apiRef = useGridApiContext();
    const { roles } = row;
    const handleChangeRoles = (event) => {
        const newSelectedRoles = event.target.value ?? [];
        apiRef.current.setEditCellValue({
            id: row.id,
            field: 'roles',
            value: newSelectedRoles,
        });
    };

    return <Select
        fullWidth
        multiple
        value={roles}
        input={<OutlinedInput label="Tag" size="small" />}
        renderValue={(selected) => selected.join(', ')}
        onChange={handleChangeRoles}
    >
        {['Super Admin', 'Faculty', 'Dean', 'Associate Dean'].map((role) => (
            <MenuItem key={role} value={role} disabled={['Super Admin', 'Faculty'].includes(role)}>
                <Checkbox checked={roles.includes(role)} />
                <ListItemText primary={role} />
            </MenuItem>
        ))}
    </Select>
});

const List = ({ errors, users }) => {
    const { auth: { department: authUserDepartment, roles: authUserRoles } } = usePage().props;

    const queryParams = new URLSearchParams(window.location.search);
    const searchKeyParam = queryParams.get('searchKey');
    const departmentParam = queryParams.get('filters[department][id]');

    const defaultDepartmentId = departmentParam ?? (!includes(authUserRoles, 'Super Admin') ? authUserDepartment?.id : null);
    const [selectedDepartmentId, setSelectedDepartmentId] = React.useState(defaultDepartmentId ?? null);

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
        let params = {
            page: newPaginationModel.page + 1,
            per_page: newPaginationModel.pageSize,
        };
        if (searchKeyParam) {
            params = { ...params, searchKey: searchKeyParam };
        }
        if (selectedDepartmentId) {
            params = {
                ...params,
                filters: {
                    department: { id: selectedDepartmentId }
                }
            };
        }
        router.get('/users', params, {
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
            editable: true,
        },
        {
            field: 'first_name',
            flex: 0.5,
            headerName: 'First Name',
            sortable: false,
            editable: true,
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
            flex: 0.5,
            headerName: 'Department',
            sortable: false,
            valueGetter: (department) => department
                ? `${department.code}`
                : '-',
        },
        {
            field: 'roles',
            flex: 1,
            headerName: 'Roles',
            sortable: false,
            editable: true,
            renderCell: ({ row: { roles } }) => {
                return <Box>
                    {roles && roles.length > 0 ? roles.map((role, index) => (
                        <Chip label={role} key={index} size="small" sx={{ mr: 0.5 }} />
                    )) : '-'}
                </Box>;
            },
            renderEditCell: (params) => {
                const { row } = params;
                return <Box sx={{ width: '100%' }}>
                    <UserRoleSelect row={row} />
                </Box>;
            },
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

    // Use a stable debounced function, not depending on paginationModel to avoid recreation on every render
    const debouncedQuickSearch = React.useMemo(
        () => debounce((newSearchKey, page, pageSize) => {
            let params = {
                page: 1,
                per_page: pageSize,
            };
            if (newSearchKey) {
                params = { ...params, searchKey: newSearchKey };
            }
            if (selectedDepartmentId) {
                params = {
                    ...params,
                    filters: {
                        department: { id: selectedDepartmentId }
                    }
                };
            }
            router.get('/users', params, { preserveScroll: true });
        }, 400),
        []
    );

    const handleQuickSearch = React.useCallback((event) => {
        debouncedQuickSearch(event.target.value, paginationModel.page, paginationModel.pageSize);
    }, [debouncedQuickSearch, paginationModel.page, paginationModel.pageSize]);

    const processRowUpdate = React.useCallback(async (updateRow, originalRow) => {
        const diff = pickBy(updateRow, (value, key) => !isEqual(value, originalRow[key]));
        const response = await axios.patch(
            `/users/${updateRow.id}`,
            diff,
        );
        const { data: updatedRow } = response.data;
        return updatedRow;
    }, []);

    const handleChangeDepartment = (department) => {
        setSelectedDepartmentId(department?.id);

        let params = {
            page: paginationModel.page + 1,
            per_page: paginationModel.pageSize,
        };

        if (searchKeyParam) {
            params = { ...params, searchKey: searchKeyParam };
        }

        if (department) {
            params = {
                ...params,
                filters: {
                    department: { id: department?.id }
                }
            };
        }

        router.get('/users', params, {
            preserveScroll: true,
        });
    };

    React.useEffect(() => {
        if (departmentParam && !includes(authUserRoles, 'Super Admin')) {
            window.location.replace('/users');
        }
    }, []);

    // Clean up debounce on unmount
    React.useEffect(() => {
        return () => {
            debouncedQuickSearch.cancel();
        };
    }, [debouncedQuickSearch]);

    console.log('authUserDepartment', authUserDepartment);
    console.log('selectedDepartmentId', selectedDepartmentId);

    return (
        <React.Fragment>
            <PageHeader title="Users" />
            <Grid container spacing={2}>
                <Grid size={9}>
                    <TextField
                        fullWidth
                        defaultValue={searchKeyParam}
                        placeholder="Quick search user ID/Name/Email"
                        size="small"
                        slotProps={{
                            input: {
                                startAdornment: <Search />,
                                endAdornment: (
                                    searchKeyParam ? (
                                        <Button
                                            size="small"
                                            onClick={() => {
                                                let params = {
                                                    page: 1,
                                                    per_page: paginationModel.pageSize,
                                                };
                                                if (selectedDepartmentId) {
                                                    params = {
                                                        ...params,
                                                        filters: {
                                                            department: { id: selectedDepartmentId }
                                                        }
                                                    };
                                                }
                                                router.get('/users', params, { preserveScroll: true });
                                            }}
                                        >
                                            Clear
                                        </Button>
                                    ) : null
                                ),
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
                            editMode="row"
                            onPaginationModelChange={handlePaginationChange}
                            pageSizeOptions={[5, 10, 15, { label: 'All', value: -1 }]}
                            paginationMode="server"
                            paginationModel={paginationModel}
                            processRowUpdate={processRowUpdate}
                            rowCount={rowCount}
                            rows={users.data}
                            disableColumnMenu
                        />
                    </Box>
                </Grid>
                <Grid size={3}>
                    <Paper sx={{ marginBottom: 2, padding: 2 }}>
                        <AutocompleteDepartment
                            key={`selected-department-${selectedDepartmentId ?? 0}`}
                            defaultDepartmentId={selectedDepartmentId}
                            readOnly={!includes(authUserRoles, 'Super Admin')}
                            onChange={handleChangeDepartment}
                        />
                        <Divider sx={{ mb: 2 }}/>
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