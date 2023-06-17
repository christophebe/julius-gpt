<?php
/**
 * Plugin Name: Yoast REST API
 * Description: This plugin can be used with Julius GPT to update Yoast SEO data (seo title & description) with the WP Rest API.
 * Version: 1.0
 * Author: Christophe Lombart
 * Author URI: https://github.com/christophebe/julius-gpt
 **/

add_action('rest_insert_post', function ($post, $request, $creating) {
    $metas = $request->get_param('meta');

    if (isset($metas['yoast_wpseo_metadesc'])) {
        update_post_meta($post->ID, '_yoast_wpseo_metadesc', $metas['yoast_wpseo_metadesc']);
    }

    if (isset($metas['yoast_wpseo_title'])) {
        update_post_meta($post->ID, '_yoast_wpseo_title', $metas['yoast_wpseo_title']);
    }
}, 10, 3);


add_action('rest_api_init', function () {
    register_rest_field('post', 'meta', [
        'get_callback' => function ($post_arr) {
            $post_id = $post_arr['id'];
            $meta = get_post_meta($post_id);
            return $meta;
        },
        'update_callback' => function ($meta, $post) {
            $post_id = $post->ID;
            foreach ($meta as $meta_key => $meta_value) {
                update_post_meta($post_id, $meta_key, $meta_value);
            }
        },
        'schema' => null,
    ]);
});