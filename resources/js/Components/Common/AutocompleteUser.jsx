import { Autocomplete, TextField } from "@mui/material";
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from "react";
import axios from "axios";

const AutocompleteUser = ({
  defaultSelectedUser = null,
  error = false,
  filters = {},
  helperText = null,
  readOnly = false,
  onChange = () => { },
}) => {
  const { auth: { token } } = usePage().props;
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState(null);

  /**
     * API Calls
     */
  const fetchUsers = async () => {
    return await axios.get(
      `/api/common/users`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        params: {
          filters,
        },
      }
    );
  };

  useEffect(() => {
    (async () => {
      const { data: users } = (await fetchUsers()).data;
      setUsers(users);
      const user = users.find((user) => user.id == defaultSelectedUser?.id);
      setSelectedUser(user);
    })();
  }, []);

  return <Autocomplete
    key={`selected-user-${selectedUser?.id ?? 0}`}
    disablePortal
    fullWidth
    defaultValue={selectedUser}
    getOptionLabel={(option) => `${option.institution_id} - ${option.last_name}, ${option.first_name} ${option.total_units ? `[${option.total_units} Units]` : ''}`}
    options={users ?? []}
    onChange={(_event, value) => {
      onChange(value);
    }}
    readOnly={readOnly}
    renderInput={(params) => <TextField
      {...params}
      error={error}
      helperText={helperText}
      label="Faculty"
      size="small"
    />}
    sx={{ mb: 1 }}
  />;
};

export default AutocompleteUser;