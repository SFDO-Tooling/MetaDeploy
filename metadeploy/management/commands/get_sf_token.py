from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    help = "Prints a user's token and token secret."

    def add_arguments(self, parser):
        parser.add_argument("email")

    def handle(self, *args, **options):
        user = User.objects.filter(email=options["email"]).first()
        if user:
            output = f"TEST_TOKEN={user.token[0]}\nTEST_TOKEN_SECRET={user.token[1]}"
            self.stdout.write(self.style.SUCCESS(output))
        else:
            self.stdout.write(self.style.ERROR("No such user."))
