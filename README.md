# Bora — бразильский португальский

Сайт пилота: https://bora-portugues-pilot.onrender.com/ . Курсы: 12 уроков pt-BR и 6 уроков английского, русские объяснения, интерактивные задания, 84 записи аудио для португальского и помощник GigaChat с RAG (890 фрагментов).

## Аккаунты и база

Отдельный Supabase-проект Bora Portuguese: nsvnptuxnmutwvmuczjm (Ireland). Email/password — Supabase Auth. Для личного пилота пользователь разрешил регистрацию без подтверждения email. Восстановление по почте выключено в интерфейсе до подключения SMTP; пароль нужно сохранять. После настройки SMTP необходимо включить подтверждение email в Supabase и emailConfirmationRequired в supabase-public.json. Встроенная почта Supabase ограничена участниками команды проекта.

Таблица public.bora_progress: user_id (FK auth.users), state JSONB (профиль, диагностика, ответы, шаги уроков, заметки и история), revision, updated_at. RLS разрешает операции только владельцу. Обновление проверяет revision, триггер увеличивает её: конфликт устройств не приводит к тихой перезаписи. Миграция: supabase/migrations/202611120001_bora_progress.sql. Применена через SQL Editor нового проекта. Проверка supabase/rls-test.sql создаёт временные тестовые данные и откатывает их.

Новый прогресс не записывается в localStorage. В браузере сохраняется только сессия Supabase Auth. Несохранённые изменения остаются в памяти до подтверждения записи; виден статус сохранения, при закрытии вкладки с ними появляется предупреждение. Для старых локальных профилей есть явный импорт в разделе аккаунта. Изменения в базе не заменяются импортом без подтверждения пользователя.

В supabase-public.json находятся публичный URL и publishable key, предназначенный для клиента. Он не даёт административных прав: доступ ограничен JWT пользователя и RLS. Пароля базы и service-role ключа в приложении нет. При необходимости конфигурация переопределяется SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY. /api/config публикует только эти клиентские параметры.

## Запуск и проверки

Node.js 24. npm ci. Для обновления браузерного SDK: npm run build:auth. Запуск: npm start. Локальные секреты GigaChat — в .env (шаблон .env.example); запуск с ними: node --env-file=.env server.cjs. npm test проверяет маршруты, RAG, лимиты, сохранение состояния, конфликты, задания и аудио. Реальные Auth/email и PostgreSQL проверяются отдельно.

Render: main, Root Directory пустой, Build node --check server.cjs && node check.cjs, Start npm start, health /health. Бесплатный сервер может запускаться после простоя. GigaChat использует серверные GIGACHAT_AUTH_KEY, GIGACHAT_SCOPE, GIGACHAT_MODEL. Помощник доступен только после входа; лимиты общие для Render и Vercel.

## Материалы и аудио

Русский курс — сокращённая адаптация выбранных тем Português para principiantes (UW–Madison), CC BY-NC-SA 4.0; английский — A Digital Workbook for Beginning ESOL (Eric Dodson, Davida Jordan, Timothy Krause), CC BY 4.0. Ссылки и условия в уроках и knowledge/README.md. Исходные авторы адаптацию не проверяли. Перед платным запуском необходимо исключить или отдельно лицензировать NC-материалы. Учебный прогресс не является оценкой CEFR или сертификатом Celpe-Bras.

Аудио pt-BR: 15 живых записей UW–Madison по CC BY-NC-SA 4.0 и 69 синтезированных записей Microsoft Francisca с отдельными пометками. Точный текст и происхождение — dist/audio-manifest.js. Плеер поддерживает повтор и 0,8×. Генерация заранее: prepare-audio.cjs, инструменты npm ci --prefix audio-tools. Во время урока синтез не вызывается. Список для будущей живой озвучки: audio-recording-list.json. Фото предоставлены пользователем; права отдельно не проверены.

Ручная проверка реальной базы: `node scripts/cloud-smoke.cjs`. Она создаёт два технических аккаунта с адресами @example.invalid, проверяет регистрацию, сохранение после повторного входа и изоляцию чтения/записи. Эти аккаунты остаются в тестовом проекте; скрипт не удаляет пользователей. Данные входа первого сохраняются только в игнорируемом .env.bora-smoke. Не включать этот сценарий в автоматический запуск CI.

## Vercel
Production uses static files from dist and Node API functions from api. Apply supabase/migrations/202611120003_chat_quotas.sql before deployment. Configure GIGACHAT_AUTH_KEY and GIGACHAT_SCOPE as sensitive server environment variables for production and preview. No service-role key is needed. The chat requires a Supabase session; shared database quotas enforce 6 requests per user per minute, 200 total per UTC day and 2 concurrent requests. Leases expire after 5 minutes if a function stops unexpectedly.
Keep the existing Supabase project: users and progress remain available after signing in on the new domain. Add the production URL to Supabase Auth URL configuration. Browser login sessions and the pilot access code are entered again on the new domain. Render remains a backup.


## Adaptive start and expanded Portuguese course
New accounts select Brazilian Portuguese and their learning goal in onboarding, then enter a resumable 4–16 item placement. Four original items per band combine receptive tasks and controlled written production. Promotion needs at least 3/4 including the written item; stop at the first unmet band or the B1 ceiling. This is an uncalibrated low-stakes routing heuristic, not an official CEFR or Celpe-Bras assessment. No speaking/listening level is inferred. Wrong answers link to concrete lessons. Ten past assessments are retained; existing lesson completion is never changed by placement.
The Portuguese course now contains 30 lessons in 5 modules, with explanations, pitfalls, practice, writing and real-life missions. Existing lesson IDs are stable. Additional audio is explicitly labelled synthetic pt-BR; existing native recordings keep attribution.
References: https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions and https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/celpe-bras .

## Голосовая практика
После завершения каждого pt-BR урока открывается #practice/<lesson-id>. GigaChat получает проверенный контекст урока с сервера и возвращает отдельные поля: португальская реплика, русский перевод, простая обратная связь. История, черновик и количество ответов хранятся в bora_progress; исходный звук не сохраняется. Завершение практики не считается проверкой произношения.
Бесплатный браузерный адаптер: SpeechRecognition/webkitSpeechRecognition (пользователь явно включает микрофон) и SpeechSynthesis с выбором только pt-BR. Если pt-BR голоса нет, озвучка не подменяется русским или европейским португальским. Наличие/качество голоса и распознавания зависят от устройства; сервер распознавания браузера может получать аудио. Текст можно проверить до отправки в GigaChat. Беседа доступна текстом при отсутствии микрофона. Качество, неотличимое от носителя, не гарантируется; для стабильного голоса нужен отдельный речевой провайдер, например Azure Speech, после выбора владельцем и подключения ключа.
Проверка настоящего ответа: node --env-file=.env.bora-smoke scripts/practice-smoke.cjs (учётные данные технического аккаунта остаются в игнорируемом файле).
