from flask_oauthlib.client import OAuth

oauth = OAuth()
oauth_providers = dict()
oauth_response_keys = dict()

oauth_response_keys['facebook'] = 'access_token'
oauth_providers['facebook'] = oauth.remote_app('facebook',
                                               request_token_params={'scope': 'email'},
                                               base_url='https://graph.facebook.com',
                                               request_token_url=None,
                                               access_token_method='GET',
                                               access_token_url='/oauth/access_token',
                                               authorize_url='https://www.facebook.com/dialog/oauth',
                                               app_key='FACEBOOK')

oauth_response_keys['github'] = 'access_token'
oauth_providers['github'] = oauth.remote_app('github',
                                             request_token_params={'scope': 'user:email'},
                                             base_url='https://api.github.com/',
                                             request_token_url=None,
                                             access_token_method='POST',
                                             access_token_url='https://github.com/login/oauth/access_token',
                                             authorize_url='https://github.com/login/oauth/authorize',
                                             app_key='GITHUB'
                                             )

oauth_response_keys['google'] = 'access_token'
oauth_providers['google'] = oauth.remote_app('google',
                                             request_token_params={'scope': 'email'},
                                             base_url='https://www.googleapis.com/oauth2/v1/',
                                             request_token_url=None,
                                             access_token_method='POST',
                                             access_token_url='https://accounts.google.com/o/oauth2/token',
                                             authorize_url='https://accounts.google.com/o/oauth2/auth',
                                             app_key='GOOGLE')

oauth_response_keys['twitter'] = 'oauth_token'
oauth_providers['twitter'] = oauth.remote_app('twitter',
                                              base_url='https://api.twitter.com/1/',
                                              request_token_url='https://api.twitter.com/oauth/request_token',
                                              access_token_url='https://api.twitter.com/oauth/access_token',
                                              authorize_url='https://api.twitter.com/oauth/authenticate',
                                              app_key='TWITTER'
                                              )

