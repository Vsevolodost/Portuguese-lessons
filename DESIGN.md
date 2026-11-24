# Bora: учебный атлас Бразилии

## Confirmed direction

Пользователь выбрал «Путешествие по Бразилии: карта, города и отметки пройденного» и запросил существенно более выразительный интерфейс. Сохраняются название, бразильская направленность, две темы и зелёное выделение пройденных занятий. Продуктовые ограничения: PRODUCT.md.

## Visual world and first screen

Рабочий учебный интерфейс с характером географического атласа: глубокий синий для навигации, зелёный для сохранённого прогресса, тёплый жёлтый для выбранной остановки, светлая голубоватая поверхность карты и реальные фотографии городов. В тёмной теме поверхности становятся сине-зелёными, сохраняя семантику состояний.

Главная: обычная навигация → выбор раздела → карта и карточка занятия → доступный список остановок. На телефоне карточка с основной кнопкой предшествует карте. Каталог всех занятий и упражнения сохраняют привычные маршруты и управление.

## Signature interaction

Точка на карте и пункт списка выбирают одну учебную остановку. Справа меняются город, фотография и содержание занятия. Выбор не означает завершение и не меняет учебный прогресс. Начало занятия — отдельное явное действие. Несовпадающие результаты старой версии урока не превращаются в новые отметки.

## Cartography

Контур страны — Natural Earth, public domain. Координаты учебных локаций приблизительные. Близкие маркеры раздвигаются для читаемости и соединяются с географическими точками выносками. Нумерация и соединения обозначают учебную последовательность, не транспортный маршрут.

## Interface system

Один шрифт интерфейса, обычные кнопки и select, читаемый основной текст, реальные данные прогресса. Карта — SVG-геометрия с обычными HTML-кнопками поверх. Список является полноценной альтернативой карте. Без WebGL, бесконечных эффектов, искусственных баллов, блокировки тем и обязательного перетаскивания.

## Motion

Только короткая обратная связь и смена выбранной остановки, с учётом reduced motion. Чтение и выполнение заданий не сопровождаются движущимся фоном. Фокус не анимируется; клавиатура имеет тот же доступ к точкам и списку.

## Implementation references

В build-your-own-x изучен материал Auth0 «Developing Games with React, Redux, and SVG»: использованы идеи разделения состояния и SVG-представления. Исходный код статьи не копируется; существующий стек Bora не заменяется React/Redux.

Impeccable direction seed: seed:abf1ceaaade7ae41; внешние варианты недоступны, выбранное пользователем направление имеет приоритет. Из семи рассмотренных основ (туристические открытки, бразильская модернистская графика, географический атлас, транспортная схема, путевой дневник, посадочный талон, фотожурнал) атлас выбран как рабочая форма карты и учебных остановок. Декоративная имитация бумажных документов не используется.

Sources: [build-your-own-x](https://github.com/codecrafters-io/build-your-own-x), [state and SVG tutorial](https://auth0.com/blog/developing-games-with-react-redux-and-svg-part-1/), [Natural Earth data](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_110m_admin_0_countries.geojson), [public-domain terms](https://www.naturalearthdata.com/about/terms-of-use/).

## Short practice, 24 November 2026

The existing atlas remains the visual authority. A single-task practice surface uses the same semantic surfaces, answer colours and focus styles. A visible exit is always available, matching requires no drag, and a translation/rule primer comes before recall. Progress belongs to the practice session, not an invented proficiency score. Source observations and implementation limits: docs/duolingo-rea.md.

## Stable mobile classroom and explorable cities

At up to 700px, lessons and short practice use one 100dvh classroom: a compact exit/header, independently scrollable material and a reserved bottom feedback/action dock. The main page and navigation do not scroll during answers. The Continue button keeps its position before and after feedback or skipping. Long material remains readable inside the content pane. Success save messages and audio provenance captions are absent from the study UI; errors stay actionable, and source/provenance data remains in materials and audio metadata.

The atlas offers lesson and city modes. Twelve curated cities have photos, Portuguese names, concise geography/context and a related phrase/topic. Zoom is bounded to 100–300%; the enlarged map scrolls natively in two dimensions. A city list provides an alternative to map navigation. Exploration and scale are transient, independent of saved learning progress.
