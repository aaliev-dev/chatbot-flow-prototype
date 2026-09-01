# Чатботоапп — интерактивный прототип флоу

Кликабельный прототип флоу из Figma (макеты: [Untitled, node 1:1018](https://www.figma.com/design/aqcJ1L3KkSmqxKhpjXuNGC/Untitled?node-id=1-1018)).

## Флоу

1. **Экран 1** — «ЧАТБОТОАПП»: жмём «Залогиниться» → экран 2.
2. **Экран 2** — список чатботов, оверлимит «6 of 5», Continue задизейблен.
3. Тык на корзинку → диалог «Удалить чатбота?» → **Delete** удаляет строку, **Cancel** / крестик / Esc закрывают.
4. Когда чатботов ≤ 5 — заголовок становится зелёным, **Continue** активируется и ведёт на [Google-форму](https://docs.google.com/forms/d/e/1FAIpQLSegZkuyrvsgqxFXrXsUU0V4mICHIbQSNE3CruYJScyMLKdTYA/viewform?usp=publish-editor).

## Запуск локально

Статика без сборки: просто открыть `index.html` в браузере, либо

```bash
python3 -m http.server 8765
```

и открыть http://localhost:8765.

## Стек

- Vanilla HTML/CSS/JS, без зависимостей и сборщиков — это и деплоится на GitHub Pages.
- Иконки — точные SVG из Figma (`assets/`, URL ассетов из Figma живут ~7 дней, поэтому байты скачаны в репо).
- Шрифты Inter / Inter Tight — с Google Fonts.
