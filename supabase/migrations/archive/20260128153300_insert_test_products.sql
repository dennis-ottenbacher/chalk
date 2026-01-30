-- Insert Test Products
-- This migration ensures test products are available without a full DB reset.
INSERT INTO
    public.products (
        id,
        name,
        description,
        price,
        type,
        tax_rate
    )
VALUES (
        '44444444-4444-4444-4444-444444444441',
        'Liquid Chalk',
        '200ml Flasche, Premium Grip',
        12.90,
        'goods',
        19.00
    ),
    (
        '44444444-4444-4444-4444-444444444442',
        'Tageskarte Erwachsen',
        'Einmaliger Eintritt für den ganzen Tag',
        14.50,
        'entry',
        19.00
    ),
    (
        '44444444-4444-4444-4444-444444444443',
        'Leihschuhe',
        'Kletterschuhe in verschiedenen Größen',
        4.00,
        'rental',
        19.00
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'Protein Riegel',
        'Schoko-Nuss, 50g',
        2.50,
        'goods',
        7.00
    ),
    (
        '44444444-4444-4444-4444-444444444445',
        'Gutschein 20€',
        'Wertgutschein für alle Leistungen',
        20.00,
        'voucher',
        0.00
    ) ON CONFLICT (id) DO NOTHING;