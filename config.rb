page '/*.xml', layout: false
page '/*.json', layout: false
page '/*.txt', layout: false
page '/*.ico', layout: false

configure :development do
  activate :livereload
end

configure :build do
  activate :minify_css
  activate :relative_assets
  # activate :minify_javascript
end
