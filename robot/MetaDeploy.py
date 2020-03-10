import json
import pathlib

from robot.libraries.BuiltIn import BuiltIn
from selenium.webdriver.chrome.options import Options


class MetaDeploy:

    ROBOT_LIBRARY_SCOPE = "GLOBAL"

    def __init__(self, lang):
        self.lang = lang

        langfam = lang.split("-")[0]
        trans_path = (
            pathlib.Path(__file__).parent.parent / f"locales/{langfam}/translation.json"
        ).absolute()
        with open(trans_path, "r") as f:
            self.translations = json.load(f)

    @property
    def selenium(self):
        return BuiltIn().get_library_instance("SeleniumLibrary")

    def open_browser_with_language(self, url, headless=True):
        options = Options()
        if headless:
            options.set_headless(True)
            options.add_argument("--disable-dev-shm-usage")
            options.add_argument("--disable-background-timer-throttling")
        else:
            options.add_experimental_option(
                "prefs", {"intl.accept_languages": self.lang}
            )
        options.add_argument(f"lang={self.lang}")
        self.selenium.open_browser(url, browser="Chrome", options=options)

    def translate_text(self, orig_text):
        return self.translations[orig_text]
