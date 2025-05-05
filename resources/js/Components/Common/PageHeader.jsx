import React, { } from 'react';
import { Breadcrumbs, Chip, Paper, Typography } from "@mui/material";
import { Link } from '@inertiajs/react';

const PageHeader = ({ title, subtitle = null, links = [] }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        backgroundColor: "info.main",
        color: "white",
        p: 3,
        mb: 3,
        borderRadius: 2,
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
      }}
      variant="outlined"
    >
      {!!links.length && (
        <Breadcrumbs sx={{ mb: 1 }}>
          {links.map((link, index) =>
            link?.to ? (
              <Link key={index} href={link.to} style={{ color: "white", textDecoration: "none" }}>
                {link.title}
              </Link>
            ) : (
              <Typography key={index} color="inherit">
                {link.title}
              </Typography>
            )
          )}
        </Breadcrumbs>
      )}
      <Typography variant="h4" sx={{ fontWeight: "bold" }}>
        {title}
      </Typography>
      {subtitle && <Chip label={subtitle} color="primary" sx={{ fontSize: "0.875rem", mt: 1 }} />}
    </Paper>
  );
};

export default PageHeader;