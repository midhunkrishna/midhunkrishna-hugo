class PostsController < ApplicationController
  def posts
    @posts = Post.order(published_at: :desc)
  end
end
