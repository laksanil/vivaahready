import { SNSClient, PublishCommand, CreateTopicCommand } from '@aws-sdk/client-sns'
import { isTestMode } from '@/lib/testMode'

const region = process.env.AWS_REGION || 'us-east-1'
const accessKeyId = process.env.AWS_ACCESS_KEY_ID
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

const snsClient =
  accessKeyId && secretAccessKey
    ? new SNSClient({
        region,
        credentials: { accessKeyId, secretAccessKey },
      })
    : null

// Topic ARNs are set via env vars or auto-created
const TOPIC_PREFIX = process.env.SNS_TOPIC_PREFIX || 'vivaahready'

// Cache resolved topic ARNs
const topicArnCache: Record<string, string> = {}

/**
 * Get or create an SNS topic ARN for a given event
 */
async function getTopicArn(eventName: string): Promise<string | null> {
  if (!snsClient) return null

  const topicName = `${TOPIC_PREFIX}-${eventName}`

  // Check cache
  if (topicArnCache[topicName]) return topicArnCache[topicName]

  // Check env var override
  const envKey = `SNS_TOPIC_ARN_${eventName.toUpperCase().replace(/-/g, '_')}`
  const envArn = process.env[envKey]
  if (envArn) {
    topicArnCache[topicName] = envArn
    return envArn
  }

  try {
    // CreateTopic is idempotent — returns existing ARN if topic already exists
    const command = new CreateTopicCommand({ Name: topicName })
    const result = await snsClient.send(command)
    if (result.TopicArn) {
      topicArnCache[topicName] = result.TopicArn
      return result.TopicArn
    }
  } catch (error) {
    console.error(`Failed to get/create SNS topic ${topicName}:`, error)
  }

  return null
}

/**
 * Publish an event to its SNS topic for fan-out
 * Used for logging, analytics, and future Lambda/SQS consumers
 */
export async function publishToTopic(
  event: string,
  data: Record<string, string>
): Promise<{ success: boolean; messageId?: string }> {
  if (isTestMode) {
    console.info('SNS topic publish skipped in test mode', { event })
    return { success: true, messageId: 'test-topic' }
  }

  if (!snsClient) {
    // Silently skip if SNS is not configured — topics are optional
    return { success: true }
  }

  const topicArn = await getTopicArn(event)
  if (!topicArn) {
    return { success: false }
  }

  try {
    const command = new PublishCommand({
      TopicArn: topicArn,
      Message: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        data,
      }),
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: event,
        },
      },
    })

    const result = await snsClient.send(command)
    return { success: true, messageId: result.MessageId }
  } catch (error) {
    console.error(`Failed to publish to SNS topic ${event}:`, error)
    return { success: false }
  }
}
