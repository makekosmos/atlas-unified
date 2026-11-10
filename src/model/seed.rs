use super::*;
// Seed data (src/dev/seed.ts + src/dev/pseudoCalendar.ts)
// ---------------------------------------------------------------------------

pub fn new_todo(id: impl Into<String>, title: &str) -> Todo {
    todo(id, title)
}

pub(crate) fn todo(id: impl Into<String>, title: &str) -> Todo {
    Todo {
        id: id.into(),
        title: title.into(),
        notes: None,
        scheduled_date: None,
        is_today: false,
        is_someday: false,
        status: Status::Inbox,
        is_completed: false,
        completed_at: None,
        is_trashed: false,
        created_at: String::new(),
        project_id: None,
        sort_order: 0,
    }
}

/// Six days of the journal, so the page has something to show: plain notes,
/// one short day, one long day.
pub fn seed_journal() -> Vec<crate::store::JournalEntry> {
    use crate::store::JournalEntry;
    vec![
        JournalEntry::demo(
            "demo:journal-1",
            "Утро началось с тишины. Сделал зарядку, выпил кофе, разобрал входящие: три письма и две задачи.",
            &super::iso_at(-6, 8, 40),
        ),
        JournalEntry::demo(
            "demo:journal-2",
            "Долгий день. Сводил макеты, спорил про отступы, в итоге оставил 16 на 24. Вечером читал про типы данных в AnyType.",
            &super::iso_at(-5, 21, 5),
        ),
        JournalEntry::demo(
            "demo:journal-3",
            "Коротко: устал.",
            &super::iso_at(-4, 22, 30),
        ),
        JournalEntry::demo(
            "demo:journal-4",
            "Проверил редактор на большой заметке. Прокрутка ровная, ввод без задержки. Записал выводы в заметку «Разбор парсера».",
            &super::iso_at(-3, 19, 12),
        ),
        JournalEntry::demo(
            "demo:journal-5",
            "Гулял два часа. Придумал, как показать историю открытий в сайдбаре: десять последних, тихо, без иконок.",
            &super::iso_at(-2, 18, 0),
        ),
        JournalEntry::demo(
            "demo:journal-6",
            "Сегодня без компьютера почти весь день. Только вечером сел за код: доделал панель и записал план на неделю.",
            &super::iso_at(-1, 20, 45),
        ),
    ]
}

pub fn seed_todos() -> Vec<Todo> {
    let mut v: Vec<Todo> = vec![
        todo("dev-inbox-1", "Перечитать бриф по лендингу"),
        todo("dev-inbox-2", "Записаться к стоматологу"),
        todo("dev-inbox-3", "Идея: виджет погоды в сайдбаре"),
        {
            let mut t = todo("dev-today-1", "Созвон по дизайну");
            t.status = Status::Todo;
            t.is_today = true;
            t
        },
        {
            let mut t = todo("dev-today-2", "Отправить инвойс клиенту");
            t.status = Status::Todo;
            t.scheduled_date = Some(day_key(0));
            t.project_id = Some("dev-proj-release".into());
            t
        },
        {
            let mut t = todo("dev-today-evening", "Почитать главу книги");
            t.status = Status::Todo;
            t.is_today = true;
            t
        },
        {
            let mut t = todo("dev-overdue-1", "Вернуть правки по макетам");
            t.status = Status::Todo;
            t.scheduled_date = Some(day_key(-1));
            t
        },
        {
            let mut t = todo("dev-checklist-1", "Подготовить демо для команды");
            t.status = Status::Todo;
            t.scheduled_date = Some(day_key(1));
            t.project_id = Some("dev-proj-release".into());
            t
        },
        {
            let mut t = todo("dev-week-2", "Ревью PR по навигации");
            t.status = Status::Todo;
            t.scheduled_date = Some(day_key(2));
            t.project_id = Some("dev-proj-release".into());
            t
        },
        {
            let mut t = todo("dev-week-3", "Оплатить интернет");
            t.status = Status::Todo;
            t.scheduled_date = Some(day_key(3));
            t.project_id = Some("dev-proj-home".into());
            t
        },
        {
            let mut t = todo("dev-week-4", "Купить подарок Маше");
            t.status = Status::Todo;
            t.scheduled_date = Some(day_key(4));
            t
        },
        {
            let mut t = todo("dev-recurring-1", "Поливать цветы");
            t.status = Status::Todo;
            t.scheduled_date = Some(day_key(0));
            t
        },
        {
            let mut t = todo("dev-next-week-1", "Запланировать отпуск");
            t.status = Status::Todo;
            t.scheduled_date = Some(day_key(8));
            t
        },
        {
            let mut t = todo("dev-someday-1", "Собрать домашний кинотеатр");
            t.status = Status::Todo;
            t.is_someday = true;
            t.project_id = Some("dev-proj-home".into());
            t
        },
        {
            let mut t = todo("dev-done-today", "Утренняя планёрка");
            t.status = Status::Done;
            t.is_completed = true;
            t.completed_at = Some(iso_at(0, 9, 30));
            t.scheduled_date = Some(day_key(0));
            t
        },
        {
            let mut t = todo("dev-done-yesterday", "Позвонить в банк");
            t.status = Status::Done;
            t.is_completed = true;
            t.completed_at = Some(iso_at(-1, 14, 0));
            t
        },
        {
            let mut t = todo("dev-trash-1", "Черновик: старый план переезда");
            t.is_trashed = true;
            t
        },
    ];
    v[0].notes = Some("Обратить внимание на секцию про ценообразование.".into());
    let created = Local::now().to_rfc3339();
    for (i, t) in v.iter_mut().enumerate() {
        t.created_at = created.clone();
        t.sort_order = i as i32;
    }
    v
}
