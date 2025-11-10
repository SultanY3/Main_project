import requests
import time

BASE = 'http://127.0.0.1:8000/api'

def register(username, email, password):
    url = f"{BASE}/auth/register/"
    data = {"username": username, "email": email, "password": password}
    r = requests.post(url, json=data)
    print('REGISTER', r.status_code, r.text)
    return r

def obtain_token(username, password):
    url = f"{BASE}/token/"
    r = requests.post(url, json={"username": username, "password": password})
    print('TOKEN', r.status_code, r.text)
    if r.status_code == 200:
        return r.json().get('access')
    return None

def get_categories():
    url = f"{BASE}/categories/"
    r = requests.get(url)
    print('CATEGORIES', r.status_code)
    return r.json()

def create_recipe(token, title, category_id):
    url = f"{BASE}/recipes/"
    headers = {'Authorization': f'Bearer {token}'}
    payload = {
        'title': title,
        'description': 'Smoke test description',
        'instructions': 'Do this, then that',
        'category_id': category_id,
        'ingredients': []
    }
    r = requests.post(url, json=payload, headers=headers)
    print('CREATE_RECIPE', r.status_code, r.text)
    return r

def follow_user(token, user_id):
    url = f"{BASE}/users/{user_id}/follow/"
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.post(url, headers=headers)
    print('FOLLOW', r.status_code, r.text)
    return r

def unfollow_user(token, user_id):
    url = f"{BASE}/users/{user_id}/unfollow/"
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.delete(url, headers=headers)
    print('UNFOLLOW', r.status_code, r.text)
    return r

def favorite_recipe(token, recipe_id):
    url = f"{BASE}/recipes/{recipe_id}/favorite/"
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.post(url, headers=headers)
    print('FAVORITE', r.status_code, r.text)
    return r

def main():
    t = int(time.time())
    u1 = f'smokeuser1_{t}'
    u2 = f'smokeuser2_{t}'
    pw = 'Password123!'

    # register user1
    register(u1, f'{u1}@example.com', pw)
    token1 = obtain_token(u1, pw)
    if not token1:
        print('Failed to get token for user1')
        return

    # get a category
    cats = get_categories()
    # categories endpoint may be paginated
    if isinstance(cats, dict) and 'results' in cats:
        cats_list = cats['results']
    else:
        cats_list = cats
    if not cats_list:
        print('No categories found; aborting')
        return
    cat_id = cats_list[0].get('id')

    # create a recipe as user1
    cr = create_recipe(token1, 'Smoke Test Recipe', cat_id)
    if cr.status_code not in (200,201):
        print('Recipe creation failed')
        return
    recipe = cr.json()
    recipe_id = recipe.get('id')

    # register user2 and obtain token
    register(u2, f'{u2}@example.com', pw)
    token2 = obtain_token(u2, pw)
    if not token2:
        print('Failed to get token for user2')
        return

    # user2 follows user1 (need user1 id) - get user1 profile
    # assume user1 id is available at recipe.author or via /users/me/ when logged in as user1
    # get user1 id from /users/me/ using token1
    r = requests.get(f"{BASE}/users/me/", headers={'Authorization': f'Bearer {token1}'})
    print('/users/me/', r.status_code, r.text)
    if r.status_code != 200:
        print('Cannot get user1 id')
        return
    user1_id = r.json().get('id')

    # user2 follows user1
    follow_user(token2, user1_id)

    # check follow status
    r = requests.get(f"{BASE}/users/{user1_id}/follow-status/", headers={'Authorization': f'Bearer {token2}'})
    print('FOLLOW_STATUS', r.status_code, r.text)

    # favorite the recipe as user2
    favorite_recipe(token2, recipe_id)

    # unfollow
    unfollow_user(token2, user1_id)

    print('SMOKE TEST COMPLETE')

if __name__ == '__main__':
    main()
