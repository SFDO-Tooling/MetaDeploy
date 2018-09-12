import pytest


@pytest.mark.django_db
class TestIconProperty:
    def test_uses_icon_url(self, product_factory):
        product = product_factory(icon_url='https://example.com/example.png')
        assert product.icon == {
            'type': 'url',
            'url': 'https://example.com/example.png',
        }

    def test_uses_slds_attrs(self, product_factory):
        product = product_factory(
            slds_icon_category='action',
            slds_icon_name='test',
        )
        assert product.icon == {
            'type': 'slds',
            'category': 'action',
            'name': 'test',
        }

    def test_default(self, product_factory):
        product = product_factory()
        assert product.icon is None
