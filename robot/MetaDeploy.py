import json
import pathlib

from robot.libraries.BuiltIn import BuiltIn
from selenium.webdriver.chrome.options import Options


class MetaDeploy:
    """Robot Framework library for MetaDeploy

    The library supports interacting with MetaDeploy in different languages.
    Specify the language when loading the library like this:

        Library  path/to/MetaDeploy.py  es

    Here `es` is the ISO 639-1 language code for Spanish.
    """

    ROBOT_LIBRARY_SCOPE = "GLOBAL"

    def __init__(self, lang="en"):
        self.lang = lang

        # Load translations for the target language from the locales folder
        trans_path = (
            pathlib.Path(__file__).parent.parent / f"locales/{lang}/translation.json"
        ).absolute()
        with open(trans_path) as f:
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
            # language is set a different way for non-headless mode ¯\_(ツ)_/¯
            options.add_experimental_option(
                "prefs", {"intl.accept_languages": self.lang}
            )
        options.add_argument(f"lang={self.lang}")
        self.selenium.open_browser(url, browser="Chrome", options=options)

    def translate_text(self, orig_text):
        try:
            return self.translations[orig_text]
        except KeyError:
            raise Exception(f"No {self.lang} translation found for '{orig_text}'")
