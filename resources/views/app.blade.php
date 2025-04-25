<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    @viteReactRefresh
    @vite('resources/css/app.css')
    @inertiaHead
</head>
<body>
    @inertia
    @vite('resources/js/app.jsx')
</body>
</html>