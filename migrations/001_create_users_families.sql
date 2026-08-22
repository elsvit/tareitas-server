CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    username VARCHAR(50),
    email VARCHAR(255),

    password_hash TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_username_unique UNIQUE (username),
    CONSTRAINT users_email_unique UNIQUE (email),

    CONSTRAINT users_identifier_required
        CHECK (username IS NOT NULL OR email IS NOT NULL)
);


CREATE TABLE families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(100) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


CREATE TABLE family_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    family_id UUID NOT NULL,
    user_id UUID NOT NULL,

    role VARCHAR(20) NOT NULL,

    family_role VARCHAR(30),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT family_members_family_fk
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,

    CONSTRAINT family_members_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT family_members_role_check
        CHECK (role IN ('admin', 'parent', 'child')),

    CONSTRAINT family_members_family_role_check
        CHECK (
            family_role IS NULL
            OR family_role IN (
                'aunt',
                'brother',
                'father',
                'grandfather',
                'grandmother',
                'mother',
                'nanny',
                'reviewee',
                'reviewer',
                'sister',
                'uncle',
                'other'
            )
        ),

    CONSTRAINT family_members_unique
        UNIQUE (family_id, user_id)
);


CREATE TABLE parent_profiles (
    user_id UUID PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    color VARCHAR(50),
    avatar TEXT,

    CONSTRAINT parent_profiles_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE TABLE child_profiles (
    user_id UUID PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    birthday DATE,
    color VARCHAR(50),
    avatar TEXT,
    reward NUMERIC(10, 2) NOT NULL DEFAULT 0,

    CONSTRAINT child_profiles_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


CREATE TABLE invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    family_id UUID NOT NULL,

    invited_email VARCHAR(255) NOT NULL,

    invited_by_user_id UUID NOT NULL,

    role VARCHAR(20) NOT NULL,

    family_role VARCHAR(30),

    token TEXT NOT NULL UNIQUE,

    expires_at TIMESTAMPTZ NOT NULL,

    accepted_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT invitations_family_fk
        FOREIGN KEY (family_id)
        REFERENCES families(id)
        ON DELETE CASCADE,

    CONSTRAINT invitations_invited_by_fk
        FOREIGN KEY (invited_by_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT invitations_role_check
        CHECK (role IN ('admin', 'parent', 'child')),

    CONSTRAINT invitations_family_role_check
        CHECK (
            family_role IS NULL
            OR family_role IN (
                'aunt',
                'brother',
                'father',
                'grandfather',
                'grandmother',
                'mother',
                'nanny',
                'reviewee',
                'reviewer',
                'sister',
                'uncle',
                'other'
            )
        )
);


CREATE INDEX family_members_user_id_idx
    ON family_members(user_id);

CREATE INDEX family_members_family_id_idx
    ON family_members(family_id);

CREATE INDEX invitations_family_id_idx
    ON invitations(family_id);

CREATE INDEX invitations_invited_email_idx
    ON invitations(invited_email);