document.addEventListener('DOMContentLoaded', function () {
    const toggleButton = document.getElementById('darkModeToggle');

    toggleButton.addEventListener('click', function () {
        document.body.classList.toggle('dark-mode');

        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });

    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }
});
