/*

the ultimate plan:

i want like yelp. i can when i start typing, i get suggestions. eventually if i get close enough
then i show matches.

but early on, when i have no restaruants, then there really no point in searching thigns like "food" or "burgers".
because i dont have any results to show. at the beginning i need to just search by restaruant ONLY.

as i type, need to do...
-----------------------------------------

so as i type, i need to do 2 things

1) match phrase on the title so that when it gets very close to the rest titles, it shows the rests
2) suggest terms. chi = chicken / chinese

i can do this with elastic's suggestion completion api. there are other suggestion apis but term + phrase are more
term or phrase suggesters. arfe more for like "did you mean" rather than autocomplete. for autocomplete use
https://www.elastic.co/guide/en/elasticsearch/reference/current/search-suggesters-completion.html

all suggestion api has a suggest_mode, which for us will be "always", which is what yelp uses.

i need to boost results by geo location with 
https://www.elastic.co/guide/en/elasticsearch/reference/current/suggester-context.html

putting it together.....

so as i type, we will use the suggestion completion api which uses go location to boost certain suggestions.
typing generations the search query. the search query will be call the suggestion completion api which will give
a list of results. DEPENDING ON THE RESULT AND HOW IT WAS MATCHED, if a single result "matches" due to title, then 
we should pull the doc's title, image etc etc. otherwise it matches some other texts like things in descriptions or
menu items in which case no doc is pulled. this allows showing autocomplete for actual restuarants when titles match
and term suggestions otherwise. this wont behave the way we want at first because we have no data, but as we
get more data, when someone types "food" that should match more "Mexican food" and other generic matchers. as the user
types mroe stuff, it will eventually hit a title. (does thsi actually work like that? need to find out)


https://hackernoon.com/elasticsearch-using-completion-suggester-to-build-autocomplete-e9c120cf6d87

i also need to make sure can suggest within the middle ex: 
query = mart
suggest = h mart




searchable fields include
rest.profile.name
rest.profile.description
rest.menu[x].name
rest.menu[x].description
rest.menu[x].items[x].name
rest.menu[x].items[x].description






-----------------------------------
when i search i do...

need to search with multi match at

https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html


because i need to search rest name, description, and menu.item. name + descriptions.

this is because if i type shrimp, i want to be able to find rests with shrimp therefore i need menu search.

if i type italian, i need to search descirptions, and laslty, i need to be ablet o search titles

probably the ranking of importance goes from rest > description > menu item name > menu item des

what type do i want? best field? or cross field?

The best_fields type is most useful when you are searching for multiple words best found in the same field.

The cross_fields type is particularly useful with structured documents where multiple fields should match.
For instance, when querying the first_name and last_name fields for “Will Smith”, the best match is likely to have “Will” in one field and “Smith” in the other.

unless im typing in a restaurant name, the query is usually short. it's usually just some keywords.

the question. should these keywords exist in the same or accross different fields? obviously single words dont matter.
but what about multi?

taco
mexican
chinese food - same 
pizza
pad thai - same
burgers
soup
open late
ayce sushi
hot pot - same. hot soup + clay pot is should not do well
korean bbq - same. again im not looking for a menu item to have bbq and another item have korean kimchi. gotta coexist
wood fired pizza
bar and grill


conclusion: SAME. and therefore best field


so once they click search, i do a best-field multi-search.


as the type...

i can use the suggester to suggest words UNTIL 

match-phrase-prefix kicks in with good matches???
https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-match-query-phrase-prefix.html


suggestion api can take mulitple suggestions and get results back on each of them.

thus i can use 2 suggestions, 1 for basic words and 2 for rest titles.
then show the titles when it has a really good score

*/