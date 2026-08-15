<?php
/**
 * Plugin Name: Video Funker headless bridge
 * Description: Exposes the fields the Next front end needs, and fires the publish webhook that purges its cache.
 * Version:     1.0.0
 *
 * Install as a MU-PLUGIN: wp-content/mu-plugins/vf-headless.php
 *
 * mu-plugins load unconditionally and cannot be deactivated from the admin UI.
 * That matters here: if an editor disables this by accident, the REST payload
 * silently loses `vf` — so covers, reading times and author bios vanish from
 * the live site while WordPress itself keeps looking perfectly healthy.
 *
 * This file is the WordPress half of the contract in
 * src/lib/blog/wordpress.js. The two must be read together.
 */

if (!defined('ABSPATH')) {
    exit;
}

/* ─────────────────────── The `vf` REST field ─────────────────────── */

/**
 * Everything the front end needs that core does not expose.
 *
 * It is ONE registered field rather than several, because `_fields=` in the
 * front end lists the fields it wants by name — every additional top-level
 * field is another name that has to be added in two places, and forgetting it
 * fails silently (the value is simply absent, and the UI renders without it).
 */
add_action('rest_api_init', function () {
    register_rest_field('post', 'vf', [
        'get_callback' => 'vf_rest_payload',
        'schema'       => null,
    ]);
});

function vf_rest_payload($post_arr)
{
    $post_id = $post_arr['id'];
    $author_id = (int) get_post_field('post_author', $post_id);

    return [
        // Reading time computed here, from the real body, so the number is
        // identical everywhere it appears rather than being re-derived from a
        // truncated excerpt on listing pages.
        'reading_time' => vf_reading_time($post_id),

        /**
         * A CONTENT-derived modified date.
         *
         * post_modified bumps on a category reassignment, a metabox touch, or
         * anything else that saves the post. dateModified is a claim to a
         * reader and to Google that the article changed, so it is stored
         * separately and only written when the body actually differs.
         */
        'content_modified' => get_post_meta($post_id, '_vf_content_modified', true) ?: null,

        /**
         * Every historical slug, so a rename resolves in ONE hop.
         *
         * WordPress accumulates these in _wp_old_slug, which means a post
         * renamed a -> b -> c maps both a and b straight to c. Chaining
         * redirects instead would cost a hop per rename and leak PageRank at
         * each one.
         */
        'old_slugs' => array_values(array_unique(
            get_post_meta($post_id, '_wp_old_slug') ?: []
        )),

        'author' => [
            'name'   => get_the_author_meta('display_name', $author_id) ?: null,
            'title'  => get_the_author_meta('vf_job_title', $author_id) ?: null,
            'bio'    => get_the_author_meta('description', $author_id) ?: null,
            'avatar' => get_avatar_url($author_id, ['size' => 160]) ?: null,
            /**
             * Only a REAL, live profile URL. The front end links the byline
             * when this is present, and a byline linking to a 404 is worse than
             * a byline that does not link — in the structured data it is an @id
             * pointing at a page that cannot be crawled.
             */
            'url'    => get_the_author_meta('url', $author_id) ?: null,
            // 'Person' or 'Organization'. A team byline is not a person, and
            // typing it as one puts a false claim in the article's schema.
            'type'   => get_the_author_meta('vf_author_type', $author_id) ?: 'Person',
        ],
    ];
}

function vf_reading_time($post_id)
{
    $content = get_post_field('post_content', $post_id);
    // Strip shortcodes AND tags. Counting `<figure class="wp-block-image">` as
    // three words inflates the estimate on image-heavy posts by a minute.
    $text = wp_strip_all_tags(strip_shortcodes($content));
    $words = str_word_count($text);
    return max(1, (int) round($words / 220));
}

/**
 * Write _vf_content_modified only when the BODY changed.
 *
 * Hooked to post_updated so both the old and new post objects are available —
 * on save_post the previous content is already gone and there is nothing to
 * compare against.
 */
add_action('post_updated', function ($post_id, $post_after, $post_before) {
    if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
        return;
    }
    if ($post_after->post_content !== $post_before->post_content) {
        update_post_meta($post_id, '_vf_content_modified', current_time('mysql', true));
    }
}, 10, 3);

/* ─────────────────────── The publish webhook ─────────────────────── */

/**
 * Purge the front end's cache when content changes.
 *
 * The tag names below are a FIXED CONTRACT with src/lib/blog/wordpress.js and
 * src/app/api/revalidate/route.js. This file does not name the tags directly —
 * it sends the slug and the terms, and the Next route derives them. That is
 * deliberate: three copies of a tag vocabulary is three places for it to drift,
 * and every drift is silent.
 */
add_action('transition_post_status', function ($new_status, $old_status, $post) {
    if ($post->post_type !== 'post') {
        return;
    }
    // Nothing public changed: a draft edited into another draft.
    if ($new_status !== 'publish' && $old_status !== 'publish') {
        return;
    }

    $event = 'update';
    if ($new_status === 'trash' || ($old_status === 'publish' && $new_status !== 'publish')) {
        $event = 'delete';
    }

    vf_notify([
        'slug'       => $post->post_name,
        'categories' => wp_list_pluck(get_the_category($post->ID), 'slug'),
        'tags'       => wp_list_pluck(get_the_tags($post->ID) ?: [], 'slug'),
        'event'      => $event,
    ]);
}, 10, 3);

/** A slug change is a structural event: it invalidates the redirect index. */
add_action('post_updated', function ($post_id, $post_after, $post_before) {
    if ($post_after->post_type !== 'post' || $post_after->post_status !== 'publish') {
        return;
    }
    if ($post_after->post_name === $post_before->post_name) {
        return;
    }
    vf_notify([
        'slug'       => $post_after->post_name,
        'categories' => wp_list_pluck(get_the_category($post_id), 'slug'),
        'tags'       => wp_list_pluck(get_the_tags($post_id) ?: [], 'slug'),
        'event'      => 'rename',
    ]);
    // The OLD url must be purged too, or its cached 404 outlives the rename.
    vf_notify(['slug' => $post_before->post_name, 'event' => 'rename']);
}, 10, 3);

/** Term edits invalidate the taxonomy vocabulary itself. */
foreach (['created_term', 'edited_term', 'delete_term'] as $term_hook) {
    add_action($term_hook, function ($term_id, $tt_id, $taxonomy) {
        if (!in_array($taxonomy, ['category', 'post_tag'], true)) {
            return;
        }
        vf_notify(['event' => 'terms']);
    }, 10, 3);
}

/**
 * Send the signed request.
 *
 * The timestamp is signed TOGETHER WITH the body — "{ts}.{body}" — not merely
 * sent alongside it. Signing the body alone would give anyone who captures one
 * valid request a token they could replay forever; binding the timestamp into
 * the signature means changing it invalidates the signature, which bounds the
 * replay window to the receiver's clock-skew allowance.
 *
 * `blocking => false` so a slow or unreachable front end never hangs the
 * editor's Publish button. A failed purge degrades to the front end's fallback
 * TTL; a hung admin screen is what makes people disable the integration.
 */
function vf_notify(array $payload)
{
    $endpoint = defined('VF_REVALIDATE_URL') ? VF_REVALIDATE_URL : getenv('VF_REVALIDATE_URL');
    $secret   = defined('VF_REVALIDATE_SECRET') ? VF_REVALIDATE_SECRET : getenv('VF_REVALIDATE_SECRET');

    if (!$endpoint || !$secret) {
        return;
    }

    $body = wp_json_encode($payload);
    // Milliseconds, because the receiver compares against Date.now().
    $timestamp = (string) round(microtime(true) * 1000);
    $signature = hash_hmac('sha256', $timestamp . '.' . $body, $secret);

    wp_remote_post($endpoint, [
        'headers'  => [
            'Content-Type'     => 'application/json',
            'X-VF-Timestamp'   => $timestamp,
            'X-VF-Signature'   => $signature,
        ],
        'body'     => $body,
        'timeout'  => 5,
        'blocking' => false,
    ]);
}

/* ─────────────────────── Author profile fields ─────────────────────── */

add_action('show_user_profile', 'vf_author_fields');
add_action('edit_user_profile', 'vf_author_fields');

function vf_author_fields($user)
{
    ?>
    <h2>Video Funker byline</h2>
    <table class="form-table">
        <tr>
            <th><label for="vf_job_title">Job title</label></th>
            <td>
                <input type="text" name="vf_job_title" id="vf_job_title" class="regular-text"
                       value="<?php echo esc_attr(get_the_author_meta('vf_job_title', $user->ID)); ?>" />
                <p class="description">Shown beside the name, e.g. "Head of Distribution".</p>
            </td>
        </tr>
        <tr>
            <th><label for="vf_author_type">Byline is a</label></th>
            <td>
                <?php $type = get_the_author_meta('vf_author_type', $user->ID) ?: 'Person'; ?>
                <select name="vf_author_type" id="vf_author_type">
                    <option value="Person" <?php selected($type, 'Person'); ?>>Person</option>
                    <option value="Organization" <?php selected($type, 'Organization'); ?>>Team or company</option>
                </select>
                <p class="description">
                    Pick "Team or company" for shared bylines. It changes the article's structured
                    data, which must not describe a team as a human being.
                </p>
            </td>
        </tr>
    </table>
    <?php
}

add_action('personal_options_update', 'vf_save_author_fields');
add_action('edit_user_profile_update', 'vf_save_author_fields');

function vf_save_author_fields($user_id)
{
    // Capability check, not just a nonce: without it any logged-in user can
    // POST to another user's profile update and rewrite their byline.
    if (!current_user_can('edit_user', $user_id)) {
        return;
    }
    if (isset($_POST['vf_job_title'])) {
        update_user_meta($user_id, 'vf_job_title', sanitize_text_field(wp_unslash($_POST['vf_job_title'])));
    }
    if (isset($_POST['vf_author_type'])) {
        $type = wp_unslash($_POST['vf_author_type']);
        // Allowlist, never the raw value — this string is emitted into the
        // article's JSON-LD as an @type.
        update_user_meta($user_id, 'vf_author_type', in_array($type, ['Person', 'Organization'], true) ? $type : 'Person');
    }
}
