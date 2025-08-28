import { AppBar, Box, Button, Container, Dialog, IconButton, Slide, Toolbar, Typography } from "@mui/material";
import React from "react";
import { Close } from "@mui/icons-material";
import SchedulerFacultyLoading from "./SchedulerFacultyLoading";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const SchedulerFacultyLoadingDialog = ({
  token,
  academicYearScheduleId,
  open = false,
  handleClose = () => { },
  selectedDepartment = null,
  selectedUser = null,
}) => {

  return <Dialog
    fullScreen
    open={open}
    onClose={handleClose}
    slots={{
      transition: Transition,
    }}
  >
    <AppBar sx={{ position: "sticky", top: 0 }}>
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          onClick={handleClose}
          aria-label="close"
        >
          <Close />
        </IconButton>
        <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
          Faculty Loadings
        </Typography>
      </Toolbar>
    </AppBar>
    <Container maxWidth={false} sx={{ p: 2 }}>
      <SchedulerFacultyLoading
        academicYearScheduleId={academicYearScheduleId}
        defaultSelectedDepartment={selectedDepartment}
        defaultSelectedUser={selectedUser} />
    </Container>
  </Dialog>;
};

export default SchedulerFacultyLoadingDialog;