import React, { } from 'react';
import { Box, Breadcrumbs, Divider, Typography } from "@mui/material";
import { Link } from '@inertiajs/react';

const PageHeader = ({ title, subtitle, links = [] }) => {
  return (<Box>
    {links.length && <Breadcrumbs>
      {links.map((link) => link?.to
        ? <Link href={link.to}>{link.title}</Link>
        : <Typography>{link.title}</Typography>)}
    </Breadcrumbs>}
    <Typography variant="h4">{title}</Typography>
    {subtitle && <Typography variant="subtitle1">{subtitle}</Typography>}
    <Divider sx={{ my: 2 }}/>
  </Box>);
};

export default PageHeader;