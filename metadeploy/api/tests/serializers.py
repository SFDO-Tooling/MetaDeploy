import pytest

from ..serializers import JobSerializer
from ..models import Job


@pytest.mark.django_db
class TestJobSerializer:
    def test_correct_instance_url(self, rf, user_factory, plan_factory):
        user = user_factory()
        request = rf.post('/')
        request.user = user
        plan = plan_factory()
        serializer = JobSerializer(data={
            'plan': plan.id,
            'steps': [],
        }, context=dict(request=request))

        assert serializer.is_valid(), serializer.errors

        instance_url = serializer.validated_data['instance_url']
        assert instance_url == 'https://example.com'

    def test_good_job(
            self, rf, user_factory, plan_factory, step_factory):
        user = user_factory()
        request = rf.post('/')
        request.user = user
        plan = plan_factory()
        step1 = step_factory(plan=plan)
        step2 = step_factory(plan=plan)
        step3 = step_factory(plan=plan)
        serializer = JobSerializer(data={
            'plan': plan.id,
            'steps': [
                step1.id,
                step2.id,
                step3.id,
            ],
        }, context=dict(request=request))

        assert serializer.is_valid(), serializer.errors

        serializer.save()

        assert Job.objects.count() == 1

        job = Job.objects.first()
        assert job.instance_url == 'https://example.com'
        assert job.repo_url == 'https://github.com/some/repo.git'
        assert job.flow_names == [
            step1.flow_name,
            step2.flow_name,
            step3.flow_name,
        ]
