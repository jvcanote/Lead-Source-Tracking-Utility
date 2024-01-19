<?php
/*  Plugin Name:    Lead Source Tracking Utility
	Plugin URL:     https://WEBDOGS.COM/
	Description:    Distribute data from UTM parameters to various APIs in the lead chain.
	Author:         WEBDOGS
	Version:        0.0.1
	Author URI:     http://WEBDOGS.COM/
	License:        GPLv2
 */

if ( ! defined('ABSPATH') ) {
	exit;
}

/**
 * @package LeadSourceTrackingUtilPlugin
 */

/**
 * Lead Source Tracking Utility Plugin class
 *
 * lst_util, lst-util
 */
class LeadSourceTrackingUtilPlugin {

	const VERSION    = "0.0.1";

	const ID         = "lst-util";
	const LOCAL      = "lst_util";
	const ACTION     = "lst-session";

	/**
	 * Construct class.
	 *
	 * @uses GLOBAL add_action
	 * @uses GLOBAL add_filter
	 *
	 * @since     1.0.0
	 * @access    private
	 * @return    void
	 */
	private function __construct() {

		/**
		 * @var     string  hook     wp_enqueue_scripts
		 *
		 * @var     Closure callback
		 *          Enqueue frontend scripts and inlcude localize data.
		 *
		 *          @uses   GLOBAL          wp_enqueue_script
		 *          @uses   GLOBAL          wp_localize_script
		 */
		add_action( 'wp_enqueue_scripts', function() {

			/** wp_enqueue_script */
			wp_enqueue_script(
				self::ID,
				plugins_url( basename( dirname( __FILE__ ) ) ) . '/js/' . self::LOCAL . '.js',
				array(),
				self::VERSION,
				true
			);

			/** wp_localize_script */
			wp_localize_script(
				self::ID,
				self::LOCAL,
                array(
                    'ajaxurl'                 => admin_url( 'admin-ajax.php' ),
                    'action'                  => apply_filters( 'lst_util_action', self::ACTION ),
                    'cookie_name'             => apply_filters( 'lst_util_cookie_name', LeadSourceCookie::COOKIENAME ),
                    'cookie_duration_in_days' => apply_filters( 'lst_util_cookie_duration_in_days', LeadSourceCookie::DURATION ),
                )
			);

		});

		/**
		 * @var     string    hook     wp_ajax_{@var string self::ACTION}
		 *
		 * @var     Closure callback wp_die
		 *          Do nothing for logged in users.
		 */
		add_action( 'wp_ajax_' . apply_filters( 'lst_util_action', self::ACTION ), '__return_zero' );

		/**
		 * @var     string    hook    wp_ajax_nopriv_{@var string self::ACTION}
		 *
		 * @var     Closure callback
		 *          Send JSON payoad with latest UTM Cookie.
		 */
		add_action( 'wp_ajax_nopriv_' . apply_filters( 'lst_util_action', self::ACTION ), function() {

			header( 'Content-Type: application/json' );
			die( json_encode( LeadSourceCookie::GetCookie() ) );

		});

		/**
		 * @var     string  hook     query_vars
		 *
		 * @var     Closure callback {@param array $query_vars}
		 *          Return the public query vars with UTM parameters.
		 */
		add_filter( 'query_vars', function( $query_vars ) {

			foreach ( LeadSourceCookie::MAP as $key ) {
				$query_vars[] = $key;
			}
			return $query_vars;

		});

		foreach ( LeadSourceCookie::MAP as $key ) {

			/**
			 * @var     string  hook gform_field_value_{@var string $key}
			 *
			 * @var     Closure callback {@param string $value} use {@var string $key}
			 *          Return value to Gravity Forms UTM fields.
			 */
			add_filter( "gform_field_value_{$key}", function( $value ) use ( $key ) {

				return LeadSourceCookie::GetValue( $key, $value );

			});
		}

	}

	public static function GetInstance(): self {
		static $instance = null;
		if ( ! isset( $instance ) ) {
			$instance = new self();
		}
		return $instance;
	}
}

/**
 * Lead Source Tracking Cookie
 */
final class LeadSourceCookie {

	const COOKIENAME = 'UTMSession';
	const DURATION   = 30;
	const MAP        = array(
		'campaign'   => 'utm_campaign',
		'content'    => 'utm_content',
		'medium'     => 'utm_medium',
		'source'     => 'utm_source',
		'term'       => 'utm_term',
	);

	public static function HasCookie(): bool {
		return (bool) isset( $_COOKIE[ apply_filters( 'lst_util_cookie_name', self::COOKIENAME ) ] );
	}

	public static function GetCookie(): array {
		$cookie = array();
		if ( self::HasCookie() ) {
			$cookie = wp_parse_args( $_COOKIE[ apply_filters( 'lst_util_cookie_name', self::COOKIENAME ) ], array() );
		}
		return (array) $cookie;
	}

	public static function GetValue( $key, $default = '' ): string {
		return (string) implode( '+', array_filter( array_unique( (array) ( self::GetCookie()[ $key ] ?? $default ) ) ) );
	}

}

LeadSourceTrackingUtilPlugin::GetInstance();
