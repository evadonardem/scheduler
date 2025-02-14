import { DataGrid } from "@mui/x-data-grid";
import MainLayout from "../../MainLayout";
import { Accordion, AccordionDetails, AccordionSummary, Avatar, Box, Button, Chip, Grid, Link, MenuItem, Paper, Stack, styled, TextField, Typography } from "@mui/material";
import { AccountCircle, ArrowDownward, Badge, CloudUpload, Email, ListAlt, School } from "@mui/icons-material";
import React from 'react';
import { router } from "@inertiajs/react";

const Edit = ({ departments, user }) => {
    const {
        institution_id: institutionId,
        last_name: lastName,
        first_name: firstName,
        gender,
        email,
        department: userDepartment
    } = user.data;

    return (
        <>
            <Accordion defaultExpanded>
                <AccordionSummary
                    expandIcon={<ArrowDownward />}
                >
                    <ListAlt sx={{ mr: 2 }}/>
                    <Typography flex={1}>Basic Information</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <Box sx={{ p: 2 }}>
                        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                            <Chip color="primary" icon={<Badge />} label={institutionId} />
                            <Chip color="secondary" icon={<Email />} label={email} />
                        </Stack>
                        <Grid container spacing={2}>
                            <Grid item md={5}>
                                <TextField fullWidth defaultValue={lastName} label="Last Name" variant="standard" />
                            </Grid>
                            <Grid item md={5}>
                                <TextField fullWidth defaultValue={firstName} label="First Name" variant="standard" />
                            </Grid>
                            <Grid item md={2}>
                                <TextField fullWidth select defaultValue={gender} label="Gender" variant="standard">
                                    <MenuItem value="Male">Male</MenuItem>
                                    <MenuItem value="Female">Female</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item md={10}>
                                <TextField fullWidth select defaultValue={userDepartment?.id} label="Department" variant="standard">
                                    {departments.data.map((department) => <MenuItem
                                        key={department.id}
                                        value={department.id}
                                    >{department.code} - {department.title}</MenuItem>)}
                                </TextField>
                            </Grid>
                        </Grid>
                    </Box>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary
                    expandIcon={<ArrowDownward />}
                >
                    <School sx={{ mr: 2 }} />
                    <Typography flex={1}>Educational Background</Typography>
                </AccordionSummary>
                <AccordionDetails></AccordionDetails>
            </Accordion>
        </>
    );
};

Edit.layout = page => <MainLayout children={page} title="My Profile" />;

export default Edit;