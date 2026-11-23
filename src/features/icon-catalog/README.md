# Каталог иконок

Изолированный служебный HTML-вход: `/previews/icons.html`. Основной экран и поиск — main.tsx, тема и изолированный Tailwind — styles.css, компоненты официального shadcn — ui/. Вход входит в общую сборку Vite и доступен из служебного корня приложения.

Проверка — `npm run check` и `npx playwright test --config playwright.production.config.ts tests/icon-catalog.spec.ts` из папки приложения. Продуктовые страницы этот модуль и его CSS не импортируют.
