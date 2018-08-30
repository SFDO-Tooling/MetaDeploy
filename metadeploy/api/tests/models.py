from ..models import Product


class TestIconProperty:
    def test_uses_icon_url(self):
        product = Product(icon_url='https://example.com/example.png')
        assert product.icon == {
            'type': 'url',
            'url': 'https://example.com/example.png',
        }

    def test_uses_slds_attrs(self):
        product = Product(slds_icon_category='action', slds_icon_name='test')
        assert product.icon == {
            'type': 'slds',
            'category': 'action',
            'name': 'test',
        }

    def test_default(self):
        product = Product()
        assert product.icon is None
