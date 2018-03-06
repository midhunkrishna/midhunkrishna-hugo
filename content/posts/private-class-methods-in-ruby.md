+++
date = "2017-10-18T23:49:34+05:30"
title = "private class methods in ruby"
description = "An in-depth discussion of class methods and private class methods"
type = "posts"
+++


A while back, the CTO of my client company assigned me a ticket, which was to fix a bug that has been plaguing their systems for a while. It turned out to be a bug in the custom serializer they had, which would serialize and deserialize data sent between their microservices.

This serializer was small enough to be written in a single class and had two or three methods which did all the heavy lifting and obviously were fat. After combing through the implementation for a while and testing it with data, I finally figured out the bug it carried and fixed it, but the fat methods were an eyesore, and like a good boy scout, I decided to refactor it.

The serializer dealt with no state at all which meant that the methods were all class methods, and splitting up class methods are always a pain.

```ruby
class CustomSerializer
  def self.serialize(objects, options={})
    list = associated_records(objects, options)
    unwanted_associations = blacklisted_associations(options)
    unwanted_attributes = blacklisted_attributes(options)

    list.each do | object, associations |
      remove_blacklisted_associations(associations, unwanted_associations)
      # you get the idea
    end
  end

  def self.deserialize(json, options={})
  end

  def self.blacklisted_associations(options)
  end

  def self.blacklisted_attributes(options)
  end

  def self.associated_records(options)
  end
end
```

These methods, are only usable within the context of the class, and usually, we hide them using access modifiers, but how does one hide a class method?

## Private Class Methods to the rescue.

As discussed in {{< hyperlink url="http://ruby-doc.org/core-2.0.0/Module.html#method-i-private_class_method" text="ruby docs" >}}, `private_class_methods` are used to make existing class methods hidden.

```ruby
class SimpleSingleton  # Not thread safe
  private_class_method :new
  def SimpleSingleton.create(*args, &block)
    @me = new(*args, &block) if ! @me
    @me
  end
end
```

In the above example, taken from the docs, it hides the constructor :new. But what happens when you have one too many class methods you need to hide?.

Incorporating private_class_method into our earlier class, it becomes,

```ruby
class CustomSerializer
  def self.serialize(objects, options={})
    # same
  end

  def self.deserialize(json, options={})
    # same
  end

  def self.blacklisted_associations(options)
  end

  def self.blacklisted_attributes(options)
  end

  def self.associated_records(options)
  end

  private_class_method :blacklisted_associations, :blacklisted_attributes, :associated_records
end
```

This works!, but what if the class is very large that I need to scroll all the way down to see which ones are private class methods? If only I had something similar to {{< hyperlink text="class_methods  from ActiveSupport::Concern" url="http://api.rubyonrails.org/classes/ActiveSupport/Concern.html#method-i-class_methods" >}}

Let's take a quick detour and see what public methods are.

## Public Methods in Ruby

Lets take any public method from the above class and look at it a little deeper.

```ruby
class CustomSerializer
  def self.associated_records
  end
end

# :xx > CustomSerializer.public_methods.grep /associated_records/
# => [:associated_records]

# :xx > CustomSerializer.singleton_class.instance_methods.grep /associated_records/
# => [:associated_records]
```

Basically, class methods are instance methods of any class's singleton_class or {{< hyperlink text="eigenclass." url="https://github.com/ruby/ruby/blob/v2_5_0/class.c#L15-L22" >}} This basically means that we can do something like:

```ruby
class CustomSerializer
  class << self
    private

    def associated_records
    end
  end
end

# :xx > CustomSerializer.public_methods.grep /associated_records/
# => []

# :xx > CustomSerializer.associated_records
# NoMethodError: private method `associated_records' called for CustomSerializer:Class
#   from (irb):xx

# :xx > CustomSerializer.singleton_class.private_instance_methods.grep /associated_records/
# => [:associated_records]
```

We now have a way to avoid the repetition and to improve the readability of the code. Only problem is, do all of us understand what is going on here? Ruby as a language gives us immense meta-programming flexibility and I decided to take this even further.

## How far can we go with this?

Remember the `class_methods` method defined on module from ActiveSupport::Concern? Will ruby allow us to do something like that?. Lets take a look at the source code for `class_methods` from ActiveSupport::Concern.

```ruby
# File activesupport/lib/active_support/concern.rb, line 134
def class_methods(&class_methods_module_definition)
  mod = const_defined?(:ClassMethods, false) ?
    const_get(:ClassMethods) :
    const_set(:ClassMethods, Module.new)

  mod.module_eval(&class_methods_module_definition)
end
```

The following is what happens when that method is executed:

 * the method `class_methods` checks whether there is an already exisiting constant, `:ClassMethods`
 * if it is not present, instantiate an anonymous module and set it to local variable `mod`
 * runs `module_eval on mod` with the given block.

Let's decipher what ActiveSupport does here by trying this out on the console and filling the blanks whenever necessary.

```ruby

module Holder
  mod = const_set :ClassMethods, Module.new
  mod.module_eval do
    def associated_records
    end
  end
end

# :xx > Holder::ClassMethods.class
# => Module

class CustomSerializer
  extend Holder::ClassMethod
end

# :xx > CustomSerializer.singleton_class.instance_methods.grep /associated_records/
# => [:associated_records]
```

In short, ActiveSuppoert::Concern uses an anonymous class as a temporary storage. But can we use this to create a helper of our own? This is what I came up with.

```ruby
class Object
  def private_class_methods &block
    anonymous_module = Module.new(&block)
    anonymous_module.instance_methods.each { |method| anonymous_module.send(:private, method) }
    extend(anonymous_module)
  end
end

class CustomSerializer
  private_class_methods do
    def associated_records
    end
  end
end

# :xx > CustomSerializer.singleton_class.private_instance_methods.grep /associated_records/
# => [:associated_records]
```

## Getting back to our refactor

In the end, I went with the `private_class_methods :method_A, :method_B`. Why, one might ask. I went through the code base and checked for usages of private_class_method and for classes that could use this helper. I couldnt find much. I checked for the churn of CustomSerializer class. It was very low, and again, this new method isnt documented anywhere so, another developer will have to grep through the codebase to find its definition.

In the end cons associated with patching a core class outweighed the pros of having a handy helper.
