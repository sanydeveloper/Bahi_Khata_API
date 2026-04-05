-- ============================================================
-- 1. OPENING BALANCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS opening_balance (
    id SERIAL PRIMARY KEY,
    amount NUMERIC(15,2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO opening_balance (amount)
SELECT 0 WHERE NOT EXISTS (SELECT 1 FROM opening_balance);

-- ============================================================
-- 2. ALTER stocks TABLE
-- ============================================================

-- Create bank enum type
DO $$ BEGIN
    CREATE TYPE bank_branch AS ENUM ('rajaldesar', 'didwana');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- bank column as enum
ALTER TABLE stocks DROP COLUMN IF EXISTS bank;
ALTER TABLE stocks ADD COLUMN bank bank_branch NULL;

-- weight_total as generated column
ALTER TABLE stocks DROP COLUMN IF EXISTS weight_total;
ALTER TABLE stocks ADD COLUMN weight_total NUMERIC(10,3)
    GENERATED ALWAYS AS (
        COALESCE(weight_chorsa, 0) +
        COALESCE(weight_bank999, 0) +
        COALESCE(weight_kachi_silver, 0) +
        COALESCE(weight_bank_peti, 0)
    ) STORED;

-- bill_no column (stores generated bill number like p1, s1)
ALTER TABLE stocks DROP COLUMN IF EXISTS bill_no;
ALTER TABLE stocks ADD COLUMN bill_no VARCHAR(20) NULL;

-- booking fields
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS booking_rate   NUMERIC(10,2) NULL;
ALTER TABLE stocks ADD COLUMN IF NOT EXISTS booking_weight NUMERIC(10,3) NULL;

-- sequences for bill numbers (global, never reset)
CREATE SEQUENCE IF NOT EXISTS bill_purchase_seq START 1;
CREATE SEQUENCE IF NOT EXISTS bill_sell_seq     START 1;

-- ============================================================
-- 3. INVENTORY VIEW
-- ============================================================
CREATE OR REPLACE VIEW inventory_view AS
SELECT
    silver_type,
    SUM(CASE WHEN sell_buy = 'buy' THEN qty ELSE -qty END) AS current_stock
FROM (
    SELECT 'chorsa'       AS silver_type, sell_buy, COALESCE(weight_chorsa, 0)       AS qty FROM stocks
    UNION ALL
    SELECT 'bank999'      AS silver_type, sell_buy, COALESCE(weight_bank999, 0)      AS qty FROM stocks
    UNION ALL
    SELECT 'kachi_silver' AS silver_type, sell_buy, COALESCE(weight_kachi_silver, 0) AS qty FROM stocks
    UNION ALL
    SELECT 'bank_peti'    AS silver_type, sell_buy, COALESCE(weight_bank_peti, 0)    AS qty FROM stocks
) t
GROUP BY silver_type;

-- ============================================================
-- 4. FUNCTION: get_stocks()
-- ============================================================
CREATE OR REPLACE FUNCTION get_stocks()
RETURNS TABLE (
    id                  INT,
    bill_no             VARCHAR,
    date                DATE,
    godown              VARCHAR,
    sell_buy            VARCHAR,
    amount              NUMERIC,
    customer_name       VARCHAR,
    weight_chorsa       NUMERIC,
    weight_bank999      NUMERIC,
    weight_kachi_silver NUMERIC,
    weight_bank_peti    NUMERIC,
    weight_total        NUMERIC,
    rate                NUMERIC,
    booking_rate        NUMERIC,
    booking_weight      NUMERIC,
    balance_total       NUMERIC,
    avg_rate            NUMERIC,
    bank                TEXT,
    created_at          TIMESTAMP
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.bill_no::VARCHAR,
        s.date,
        s.godown::VARCHAR,
        s.sell_buy::VARCHAR,
        s.amount,
        s.customer_name::VARCHAR,
        s.weight_chorsa,
        s.weight_bank999,
        s.weight_kachi_silver,
        s.weight_bank_peti,
        s.weight_total,
        s.rate,
        s.booking_rate,
        s.booking_weight,
        s.balance_total,
        s.avg_rate,
        s.bank::TEXT,
        s."createdAt"
    FROM stocks s
    ORDER BY s.date ASC, s.id ASC;
END;
$$;

-- ============================================================
-- 5. PROCEDURE: manage_stock — handles I / U / D
-- ============================================================
CREATE OR REPLACE PROCEDURE manage_stock(
    p_flag                  CHAR,
    p_id                    INT             DEFAULT NULL,
    p_date                  DATE            DEFAULT NULL,
    p_godown                VARCHAR         DEFAULT NULL,
    p_sell_buy              VARCHAR         DEFAULT NULL,
    p_qty                   NUMERIC         DEFAULT NULL,
    p_amount                NUMERIC         DEFAULT NULL,
    p_customer_name         VARCHAR         DEFAULT NULL,
    p_weight_chorsa         NUMERIC         DEFAULT 0,
    p_weight_bank999        NUMERIC         DEFAULT 0,
    p_weight_kachi_silver   NUMERIC         DEFAULT 0,
    p_weight_bank_peti      NUMERIC         DEFAULT 0,
    p_rate                  NUMERIC         DEFAULT NULL,
    p_bank                  bank_branch     DEFAULT NULL,
    p_booking_rate          NUMERIC         DEFAULT NULL,
    p_booking_weight        NUMERIC         DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_avg_rate      NUMERIC(10,2);
    v_prev_balance  NUMERIC(15,2);
    v_new_balance   NUMERIC(15,2);
    v_old_sell_buy  VARCHAR(10);
    v_old_amount    NUMERIC(15,2);
    v_new_qty       NUMERIC;
    v_new_rate      NUMERIC;
    v_new_sb        VARCHAR;
    v_new_amount    NUMERIC;
    v_bill_no       VARCHAR(20);
    v_row           RECORD;
BEGIN

    -- --------------------------------------------------------
    -- INSERT
    -- --------------------------------------------------------
    IF p_flag = 'I' THEN

        IF p_date IS NULL OR p_godown IS NULL OR p_sell_buy IS NULL THEN
            RAISE EXCEPTION 'date, godown and sell_buy are required for INSERT';
        END IF;

        IF p_sell_buy NOT IN ('sell', 'buy') THEN
            RAISE EXCEPTION 'sell_buy must be sell or buy';
        END IF;

        IF p_godown NOT IN ('didwana', 'rajaldesar') THEN
            RAISE EXCEPTION 'godown must be didwana or rajaldesar';
        END IF;

        -- Generate bill number
        IF p_sell_buy = 'buy' THEN
            v_bill_no := 'p' || nextval('bill_purchase_seq')::TEXT;
        ELSE
            v_bill_no := 's' || nextval('bill_sell_seq')::TEXT;
        END IF;

        -- avg_rate = rate / qty
        IF p_qty IS NOT NULL AND p_qty <> 0 AND p_rate IS NOT NULL THEN
            v_avg_rate := ROUND(p_rate / p_qty, 2);
        ELSE
            v_avg_rate := NULL;
        END IF;

        -- Get last balance_total, fallback to opening_balance
        SELECT s.balance_total INTO v_prev_balance
        FROM stocks s
        ORDER BY s.date ASC, s.id ASC
        LIMIT 1 OFFSET (SELECT COUNT(*) - 1 FROM stocks);

        IF v_prev_balance IS NULL THEN
            SELECT ob.amount INTO v_prev_balance FROM opening_balance ob ORDER BY ob.id LIMIT 1;
        END IF;

        IF v_prev_balance IS NULL THEN v_prev_balance := 0; END IF;

        -- buy decreases balance, sell increases balance
        IF p_sell_buy = 'buy' THEN
            v_new_balance := v_prev_balance - COALESCE(p_amount, 0);
        ELSE
            v_new_balance := v_prev_balance + COALESCE(p_amount, 0);
        END IF;

        INSERT INTO stocks (
            bill_no, date, godown, sell_buy, qty, amount, customer_name,
            weight_chorsa, weight_bank999, weight_kachi_silver, weight_bank_peti,
            rate, balance_total, avg_rate, bank, booking_rate, booking_weight
        ) VALUES (
            v_bill_no, p_date, p_godown, p_sell_buy, p_qty, p_amount, p_customer_name,
            p_weight_chorsa, p_weight_bank999, p_weight_kachi_silver, p_weight_bank_peti,
            p_rate, v_new_balance, v_avg_rate, p_bank, p_booking_rate, p_booking_weight
        );

    -- --------------------------------------------------------
    -- UPDATE
    -- --------------------------------------------------------
    ELSIF p_flag = 'U' THEN

        IF p_id IS NULL THEN
            RAISE EXCEPTION 'p_id is required for UPDATE';
        END IF;

        SELECT s.sell_buy, s.amount INTO v_old_sell_buy, v_old_amount
        FROM stocks s WHERE s.id = p_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Stock with id % not found', p_id;
        END IF;

        v_new_qty    := COALESCE(p_qty,      (SELECT s.qty  FROM stocks s WHERE s.id = p_id));
        v_new_rate   := COALESCE(p_rate,     (SELECT s.rate FROM stocks s WHERE s.id = p_id));
        v_new_sb     := COALESCE(p_sell_buy, v_old_sell_buy);
        v_new_amount := COALESCE(p_amount,   v_old_amount);

        IF v_new_qty IS NOT NULL AND v_new_qty <> 0 AND v_new_rate IS NOT NULL THEN
            v_avg_rate := ROUND(v_new_rate / v_new_qty, 2);
        ELSE
            v_avg_rate := NULL;
        END IF;

        UPDATE stocks SET
            date                = COALESCE(p_date,                date),
            godown              = COALESCE(p_godown,              godown),
            sell_buy            = v_new_sb,
            qty                 = v_new_qty,
            amount              = v_new_amount,
            customer_name       = COALESCE(p_customer_name,       customer_name),
            weight_chorsa       = COALESCE(p_weight_chorsa,       weight_chorsa),
            weight_bank999      = COALESCE(p_weight_bank999,      weight_bank999),
            weight_kachi_silver = COALESCE(p_weight_kachi_silver, weight_kachi_silver),
            weight_bank_peti    = COALESCE(p_weight_bank_peti,    weight_bank_peti),
            rate                = v_new_rate,
            avg_rate            = v_avg_rate,
            bank                = COALESCE(p_bank,                bank),
            booking_rate        = COALESCE(p_booking_rate,        booking_rate),
            booking_weight      = COALESCE(p_booking_weight,      booking_weight)
        WHERE id = p_id;

        -- Recalculate balance_total from this row forward
        v_prev_balance := NULL;

        FOR v_row IN
            SELECT s.id, s.sell_buy, s.amount FROM stocks s
            WHERE s.id >= p_id
            ORDER BY s.date ASC, s.id ASC
        LOOP
            IF v_prev_balance IS NULL THEN
                SELECT s.balance_total INTO v_prev_balance
                FROM stocks s
                WHERE s.id < v_row.id
                ORDER BY s.date ASC, s.id DESC
                LIMIT 1;

                IF v_prev_balance IS NULL THEN
                    SELECT ob.amount INTO v_prev_balance FROM opening_balance ob ORDER BY ob.id LIMIT 1;
                    IF v_prev_balance IS NULL THEN v_prev_balance := 0; END IF;
                END IF;
            END IF;

            IF v_row.sell_buy = 'buy' THEN
                v_new_balance := v_prev_balance - COALESCE(v_row.amount, 0);
            ELSE
                v_new_balance := v_prev_balance + COALESCE(v_row.amount, 0);
            END IF;

            UPDATE stocks SET balance_total = v_new_balance WHERE id = v_row.id;
            v_prev_balance := v_new_balance;
        END LOOP;

    -- --------------------------------------------------------
    -- DELETE
    -- --------------------------------------------------------
    ELSIF p_flag = 'D' THEN

        IF p_id IS NULL THEN
            RAISE EXCEPTION 'p_id is required for DELETE';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM stocks s WHERE s.id = p_id) THEN
            RAISE EXCEPTION 'Stock with id % not found', p_id;
        END IF;

        DELETE FROM stocks WHERE id = p_id;

        v_prev_balance := NULL;

        FOR v_row IN
            SELECT s.id, s.sell_buy, s.amount FROM stocks s
            WHERE s.id > p_id
            ORDER BY s.date ASC, s.id ASC
        LOOP
            IF v_prev_balance IS NULL THEN
                SELECT s.balance_total INTO v_prev_balance
                FROM stocks s
                WHERE s.id < v_row.id
                ORDER BY s.date ASC, s.id DESC
                LIMIT 1;

                IF v_prev_balance IS NULL THEN
                    SELECT ob.amount INTO v_prev_balance FROM opening_balance ob ORDER BY ob.id LIMIT 1;
                    IF v_prev_balance IS NULL THEN v_prev_balance := 0; END IF;
                END IF;
            END IF;

            IF v_row.sell_buy = 'buy' THEN
                v_new_balance := v_prev_balance - COALESCE(v_row.amount, 0);
            ELSE
                v_new_balance := v_prev_balance + COALESCE(v_row.amount, 0);
            END IF;

            UPDATE stocks SET balance_total = v_new_balance WHERE id = v_row.id;
            v_prev_balance := v_new_balance;
        END LOOP;

    ELSE
        RAISE EXCEPTION 'Invalid flag. Use I / U / D';
    END IF;

END;
$$;
