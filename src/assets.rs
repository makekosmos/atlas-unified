use std::borrow::Cow;

pub fn font_bytes() -> Vec<Cow<'static, [u8]>> {
    vec![
        Cow::Borrowed(include_bytes!("../assets/fonts/Inter.ttf") as &[u8]),
        Cow::Borrowed(include_bytes!("../assets/fonts/GeistMono-Regular.ttf") as &[u8]),
        Cow::Borrowed(include_bytes!("../assets/fonts/GeistMono-Medium.ttf") as &[u8]),
        Cow::Borrowed(include_bytes!("../assets/fonts/GeistMono-SemiBold.ttf") as &[u8]),
    ]
}
