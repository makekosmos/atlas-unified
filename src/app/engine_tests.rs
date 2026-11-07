use super::Atlas;
use crate::model::new_todo;
use crate::store::{Command, EngineError, ErrorKind, Reply, Snapshot, Worker};
use gpui::{AppContext as _, TestAppContext};

#[gpui::test]
fn edits_during_reload_are_saved_in_click_order(cx: &mut TestAppContext) {
    let atlas = cx.new(Atlas::new);
    atlas.update(cx, |atlas, cx| {
        let (worker, commands) = Worker::test_channel();
        atlas.demo = false;
        atlas.storage = Some(worker);
        atlas.storage_ready = true;
        atlas.todos.clear();
        atlas.refresh_storage();
        assert!(matches!(commands.try_recv(), Ok(Command::Load)));
        atlas.create_nsh_todo("first");
        atlas.create_nsh_todo("second");
        assert_eq!(atlas.pending_mutations.len(), 2);
        assert!(commands.try_recv().is_err());
        atlas.on_storage_reply(Reply::Loaded(Ok(Snapshot::default())), cx);
        let Command::Save(first) = commands.try_recv().unwrap() else {
            panic!("save expected")
        };
        assert_eq!(first.todo.title, "first");
        assert_eq!(atlas.pending_mutations.len(), 1);
        atlas.on_storage_reply(Reply::Saved(first, Ok(())), cx);
        let Command::Save(second) = commands.try_recv().unwrap() else {
            panic!("save expected")
        };
        assert_eq!(second.todo.title, "second");
        atlas.on_storage_reply(Reply::Saved(second, Ok(())), cx);
        assert_eq!(
            atlas
                .todos
                .iter()
                .map(|todo| todo.title.as_str())
                .collect::<Vec<_>>(),
            ["first", "second"]
        );
    });
}

#[gpui::test]
fn same_task_keeps_last_queued_intention_and_original_guard(cx: &mut TestAppContext) {
    let atlas = cx.new(Atlas::new);
    atlas.update(cx, |atlas, cx| {
        let (worker, commands) = Worker::test_channel();
        atlas.demo = false;
        atlas.storage = Some(worker);
        atlas.storage_ready = true;
        let before = new_todo("task", "original");
        atlas.todos = vec![before.clone()];
        atlas.refresh_storage();
        assert!(matches!(commands.try_recv(), Ok(Command::Load)));
        let mut edited = before.clone();
        edited.title = "first edit".into();
        atlas.save_todo(Some(before.clone()), edited.clone());
        atlas.create_nsh_todo("other task");
        edited.title = "last edit".into();
        atlas.save_todo(Some(before.clone()), edited);
        assert_eq!(atlas.pending_mutations.len(), 2);
        assert_eq!(atlas.pending_mutations[0].todo.id, "task");
        assert_eq!(atlas.pending_mutations[1].todo.title, "other task");
        let changed = new_todo("task", "server edit");
        atlas.on_storage_reply(
            Reply::Loaded(Ok(Snapshot {
                todos: vec![changed],
                projects: vec![],
            })),
            cx,
        );
        let Command::Save(mutation) = commands.try_recv().unwrap() else {
            panic!("save expected")
        };
        assert_eq!(atlas.todos[0].title, "server edit");
        assert_eq!(mutation.todo.title, "last edit");
        assert_eq!(mutation.before.as_ref(), Some(&before));
        atlas.on_storage_reply(
            Reply::Saved(
                mutation,
                Err(EngineError {
                    kind: ErrorKind::Conflict,
                    detail: "concurrent edit".into(),
                }),
            ),
            cx,
        );
        assert!(matches!(commands.try_recv(), Ok(Command::Load)));
    });
}

#[gpui::test]
fn busy_save_retains_another_edit(cx: &mut TestAppContext) {
    let atlas = cx.new(Atlas::new);
    atlas.update(cx, |atlas, cx| {
        let (worker, commands) = Worker::test_channel();
        atlas.demo = false;
        atlas.storage = Some(worker);
        atlas.storage_ready = true;
        atlas.create_nsh_todo("saving");
        let Command::Save(first) = commands.try_recv().unwrap() else {
            panic!("save expected")
        };
        atlas.create_nsh_todo("queued");
        assert!(commands.try_recv().is_err());
        atlas.on_storage_reply(Reply::Saved(first, Ok(())), cx);
        let Command::Save(second) = commands.try_recv().unwrap() else {
            panic!("save expected")
        };
        assert_eq!(second.todo.title, "queued");
    });
}

#[gpui::test]
fn not_ready_rejects_visibly_but_demo_still_saves(cx: &mut TestAppContext) {
    let atlas = cx.new(Atlas::new);
    atlas.update(cx, |atlas, _| {
        atlas.demo = false;
        atlas.storage_ready = false;
        atlas.storage_busy = true;
        atlas.create_nsh_todo("rejected");
        assert!(atlas.storage_error.is_some());
        assert!(atlas.pending_mutations.is_empty());
        atlas.demo = true;
        atlas.create_nsh_todo("demo");
        assert!(atlas.todos.iter().any(|todo| todo.title == "demo"));
        assert!(atlas.pending_mutations.is_empty());
    });
}
